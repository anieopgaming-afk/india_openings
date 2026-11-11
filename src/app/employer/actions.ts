"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, CITIES, CIN_RE, FREE_EMAIL_DOMAINS, GSTIN_RE, JOB_TYPES, WORK_TYPES } from "@/lib/constants";

const back = (path: string, msg: string): never => redirect(`${path}?error=${encodeURIComponent(msg)}`);
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

export async function signupEmployer(f: FormData) {
  const email = str(f, "email").toLowerCase();
  const password = str(f, "password");
  const company = str(f, "company_name");
  const gstin = str(f, "gstin").toUpperCase();
  const cin = str(f, "cin").toUpperCase();
  const domain = email.split("@")[1] ?? "";

  if (!domain.includes(".")) back("/employer/signup", "Enter a valid email address.");
  if (FREE_EMAIL_DOMAINS.has(domain)) back("/employer/signup", "Use your official work email. Gmail, Yahoo and other free addresses can't post jobs.");
  if (company.length < 2) back("/employer/signup", "Enter your company name.");
  if (password.length < 8) back("/employer/signup", "Use a password with at least 8 characters.");
  if (gstin && !GSTIN_RE.test(gstin)) back("/employer/signup", "That GSTIN isn't in the right format (15 characters, e.g. 29ABCDE1234F1Z5).");
  if (cin && !CIN_RE.test(cin)) back("/employer/signup", "That CIN isn't in the right format (21 characters, e.g. U74999KA2015PTC123456).");

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email, password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: { role: "employer", company_name: company, gstin: gstin || null, cin: cin || null },
    },
  });
  // Supabase hides trigger errors behind a generic message, which is why the checks above run first.
  if (error) back("/employer/signup", "We couldn't create your account. Check your details and try again.");
  redirect("/login?notice=" + encodeURIComponent("Check your work inbox and confirm your email, then log in."));
}

export async function login(f: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: str(f, "email"), password: str(f, "password") });
  if (error) back("/login", "Email or password is incorrect, or the email isn't confirmed yet.");
  redirect("/employer");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function postJob(f: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
  if (!profile) back("/employer", "Only employer accounts can post jobs.");

  const city = CITIES.find((c) => c.city === str(f, "city"));
  const work = str(f, "work_type"), type = str(f, "job_type"), cat = str(f, "category");
  const title = str(f, "title");
  const url = str(f, "application_url");
  const toInr = (k: string) => (str(f, k) ? Math.round(Number(str(f, k)) * 100000) : null);
  const smin = toInr("salary_min_lpa"), smax = toInr("salary_max_lpa");

  if (title.length < 3) back("/employer", "Enter a job title.");
  if (!city) back("/employer", "Choose a city from the list.");
  if (!WORK_TYPES.includes(work) || !JOB_TYPES.includes(type) || !CATEGORIES.includes(cat)) back("/employer", "Choose work mode, job type and category.");
  try { if (new URL(url).protocol !== "https:") throw 0; } catch { back("/employer", "Application link must be a full https:// URL."); }
  if (smin && smax && smax < smin) back("/employer", "Maximum salary can't be lower than minimum.");

  // RLS re-checks that company_id belongs to this user.
  const { error } = await supabase.from("jobs").insert({
    company_id: profile!.company_id, title, work_type: work, job_type: type, category: cat,
    location_city: city!.city, location_state: city!.state === "India" ? null : city!.state,
    salary_min_inr: smin, salary_max_inr: smax, application_url: url, description: str(f, "description") || null,
  });
  if (error) back("/employer", "The job couldn't be saved. Try again.");
  redirect("/employer?notice=" + encodeURIComponent("Job published."));
}

export async function closeJob(f: FormData) {
  const supabase = await createClient();
  await supabase.from("jobs").update({ status: "closed" }).eq("id", str(f, "id"));
  redirect("/employer");
}
