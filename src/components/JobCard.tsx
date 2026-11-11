import CompanyLogo from "./CompanyLogo";
import VerifiedBadge from "./VerifiedBadge";
import { fmtSalary, timeAgo } from "@/lib/format";

export type Job = {
  id: string; title: string; work_type: string; job_type: string; category: string;
  location_city: string; location_state: string | null; salary_min_inr: number | null; salary_max_inr: number | null;
  application_url: string; created_at: string;
  companies: { name: string; domain: string; logo_url: string | null; is_verified: boolean };
};

export default function JobCard({ job }: { job: Job }) {
  const c = job.companies;
  const salary = fmtSalary(job.salary_min_inr, job.salary_max_inr);
  return (
    <article className={`flex flex-col gap-4 rounded-lg border border-line bg-white p-4 sm:flex-row sm:items-center ${c.is_verified ? "border-l-[3px] border-l-forest" : ""}`}>
      <CompanyLogo name={c.name} src={c.logo_url} />
      <div className="min-w-0 flex-1">
        <h2 className="display truncate text-lg font-semibold">{job.title}</h2>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-soft">
          <span className="font-semibold text-ink">{c.name}</span>
          {c.is_verified && <VerifiedBadge />}
        </p>
        <p className="mt-1 text-sm text-soft">
          {job.location_city}{job.location_state && job.location_state !== "India" ? `, ${job.location_state}` : ""} · {job.work_type} · {job.job_type} · {timeAgo(job.created_at)}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className={`text-sm font-semibold ${salary ? "text-ink" : "text-soft"}`}>{salary ?? "Salary not disclosed"}</p>
        <a href={job.application_url} target="_blank" rel="noopener noreferrer nofollow"
           className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white hover:brightness-110">
          Apply on {c.name}&apos;s site
        </a>
      </div>
    </article>
  );
}
