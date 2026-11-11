import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import SearchFilters from "@/components/SearchFilters";
import JobCard, { type Job } from "@/components/JobCard";

const PAGE = 24;
type SP = Promise<Record<string, string | undefined>>;

export default async function Home({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const page = Math.max(1, Number(sp.page) || 1);
  const verified = sp.verified === "1";

  let query = supabase
    .from("jobs")
    .select(`id,title,work_type,job_type,category,location_city,location_state,salary_min_inr,salary_max_inr,application_url,created_at,
             companies${verified ? "!inner" : ""}(name,domain,logo_url,is_verified)`, { count: "exact" })
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE, page * PAGE - 1);

  if (verified) query = query.eq("companies.is_verified", true);
  if (sp.work) query = query.eq("work_type", sp.work);
  if (sp.type) query = query.eq("job_type", sp.type);
  if (sp.cat) query = query.eq("category", sp.cat);
  if (sp.q) {
    const q = sp.q.replace(/[,()%*]/g, " ").trim();
    if (q) query = query.or(`title.ilike.%${q}%,location_city.ilike.%${q}%,location_state.ilike.%${q}%`);
  }
  if (sp.smin) query = query.or(`salary_max_inr.gte.${Number(sp.smin) || 0},salary_max_inr.is.null`);
  if (sp.smax) query = query.or(`salary_min_inr.lte.${Number(sp.smax) || 0},salary_min_inr.is.null`);

  const [{ data, count, error }, openRoles, verifiedCos] = await Promise.all([
    query,
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("companies").select("id", { count: "exact", head: true }).eq("is_verified", true),
  ]);

  const jobs = (data ?? []) as unknown as Job[];
  const total = count ?? 0;
  const link = (n: number) => {
    const p = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
    p.set("page", String(n));
    return `/?${p}`;
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="display max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">Open roles at Indian companies you can check.</h1>
      <p className="mt-3 max-w-xl text-soft">
        {openRoles.count ?? 0} open roles · {verifiedCos.count ?? 0} verified companies. Every Apply button goes straight to the employer.
      </p>

      <div className="mt-6">
        <Suspense><SearchFilters /></Suspense>
      </div>

      <p className="mt-8 text-sm font-semibold text-soft" aria-live="polite">{total} {total === 1 ? "job" : "jobs"} found</p>

      <div className="mt-3 space-y-3">
        {error && <p className="rounded-lg border border-line bg-white p-4">Jobs could not be loaded. Refresh the page to try again.</p>}
        {!error && jobs.length === 0 && (
          <div className="rounded-lg border border-line bg-white p-6">
            <p className="font-semibold">No jobs match these filters.</p>
            <p className="text-sm text-soft">Remove a filter or search a nearby city. If the database is new, run the aggregator function to load roles.</p>
          </div>
        )}
        {jobs.map((j) => <JobCard key={j.id} job={j} />)}
      </div>

      {total > PAGE && (
        <nav className="mt-6 flex items-center justify-between text-sm font-semibold">
          {page > 1 ? <Link href={link(page - 1)} className="text-forest underline">Previous page</Link> : <span />}
          <span className="text-soft">Page {page} of {Math.ceil(total / PAGE)}</span>
          {page * PAGE < total ? <Link href={link(page + 1)} className="text-forest underline">Next page</Link> : <span />}
        </nav>
      )}
    </main>
  );
}
