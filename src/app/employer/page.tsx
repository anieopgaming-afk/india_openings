import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, CITIES, JOB_TYPES, WORK_TYPES } from "@/lib/constants";
import VerifiedBadge from "@/components/VerifiedBadge";
import { closeJob, logout, postJob } from "./actions";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { error, notice } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/employer/signup");

  const { data: profile } = await supabase.from("profiles").select("company_id, companies(name,domain,is_verified)").eq("id", user.id).single();
  const company = profile?.companies as unknown as { name: string; domain: string; is_verified: boolean } | null;
  if (!company) {
    return <main className="mx-auto max-w-xl px-4 py-10"><p>This account isn&apos;t an employer account. Sign up as an employer with your work email.</p></main>;
  }
  const { data: jobs } = await supabase.from("jobs").select("id,title,status,location_city,created_at").eq("company_id", profile!.company_id).order("created_at", { ascending: false }).limit(50);
  const input = "mt-1 w-full rounded-md border border-line bg-white px-3 py-2";

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="display text-3xl font-bold">{company.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-soft">{company.domain} {company.is_verified ? <VerifiedBadge /> : <span>Not verified yet. Add a GSTIN or CIN at signup, or contact support for review.</span>}</p>
        </div>
        <form action={logout}><button className="text-sm font-semibold text-soft underline">Log out</button></form>
      </div>

      {notice && <p className="mt-4 rounded-md bg-mist p-3 text-sm" role="status">{notice}</p>}
      {error && <p className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm" role="alert">{error}</p>}

      <h2 className="display mt-8 text-xl font-semibold">Post a job</h2>
      <form action={postJob} className="mt-3 grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-2">
        <label className="text-sm font-semibold sm:col-span-2">Job title<input name="title" required className={input} /></label>
        <label className="text-sm font-semibold">City
          <select name="city" required className={input}>{CITIES.map((c) => <option key={c.city}>{c.city}</option>)}</select>
        </label>
        <label className="text-sm font-semibold">Category
          <select name="category" className={input}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label className="text-sm font-semibold">Work mode
          <select name="work_type" className={input}>{WORK_TYPES.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label className="text-sm font-semibold">Job type
          <select name="job_type" className={input}>{JOB_TYPES.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label className="text-sm font-semibold">Min salary (LPA, optional)<input name="salary_min_lpa" type="number" min={0} step="0.5" className={input} /></label>
        <label className="text-sm font-semibold">Max salary (LPA, optional)<input name="salary_max_lpa" type="number" min={0} step="0.5" className={input} /></label>
        <label className="text-sm font-semibold sm:col-span-2">Application link (your careers page)<input name="application_url" type="url" required placeholder="https://" className={input} /></label>
        <label className="text-sm font-semibold sm:col-span-2">Description<textarea name="description" rows={4} className={input} /></label>
        <button className="rounded-md bg-forest px-4 py-2 font-semibold text-white sm:col-span-2">Publish job</button>
      </form>

      <h2 className="display mt-8 text-xl font-semibold">Your jobs</h2>
      <ul className="mt-3 space-y-2">
        {(jobs ?? []).length === 0 && <li className="text-sm text-soft">No jobs yet. Publish your first one above.</li>}
        {(jobs ?? []).map((j) => (
          <li key={j.id} className="flex items-center justify-between rounded-md border border-line bg-white px-3 py-2 text-sm">
            <span><span className="font-semibold">{j.title}</span> · {j.location_city} · {j.status}</span>
            {j.status === "active" && <form action={closeJob}><input type="hidden" name="id" value={j.id} /><button className="font-semibold text-forest underline">Close</button></form>}
          </li>
        ))}
      </ul>
    </main>
  );
}
