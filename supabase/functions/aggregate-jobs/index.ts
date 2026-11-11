// Supabase Edge Function (Deno). Pulls open roles from companies' PUBLIC job-board APIs
// (Greenhouse, Lever, Ashby) -- the feeds those platforms publish for syndication -- and
// upserts India-based roles. Also fills missing logos via Brandfetch.
//
// Deploy:  supabase functions deploy aggregate-jobs --no-verify-jwt
// Secrets: supabase secrets set CRON_SECRET=... BRANDFETCH_CLIENT_ID=... BRANDFETCH_API_KEY=...
import { createClient } from "npm:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const UA = "IndiaOpeningsBot/1.0 (job aggregator; contact: you@yourdomain.com)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Raw = {
  external_id: string; title: string; location: string; url: string; description: string;
  remote?: boolean; commitment?: string; workplace?: string;
};

// ---------- source adapters ----------
async function getJson(url: string) {
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

async function greenhouse(slug: string): Promise<Raw[]> {
  const d = await getJson(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`);
  return (d.jobs ?? []).map((j: any) => ({
    external_id: String(j.id), title: j.title, location: j.location?.name ?? "",
    url: j.absolute_url, description: clean(j.content ?? ""),
  }));
}

async function lever(slug: string): Promise<Raw[]> {
  const d = await getJson(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  return (d ?? []).map((j: any) => ({
    external_id: j.id, title: j.text, location: j.categories?.location ?? "",
    url: j.hostedUrl, description: clean(j.descriptionPlain ?? ""),
    commitment: j.categories?.commitment, workplace: j.workplaceType,
  }));
}

async function ashby(slug: string): Promise<Raw[]> {
  const d = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${slug}`);
  return (d.jobs ?? []).map((j: any) => ({
    external_id: j.id, title: j.title, location: j.location ?? "",
    url: j.jobUrl ?? j.applyUrl, description: clean(j.descriptionPlain ?? ""),
    remote: j.isRemote, commitment: j.employmentType,
  }));
}

const ADAPTERS: Record<string, (s: string) => Promise<Raw[]>> = { greenhouse, lever, ashby };

// ---------- normalisation ----------
function clean(html: string) {
  return html.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 4000);
}

const CITY_TABLE: [string, string, string[]][] = [
  ["Bengaluru", "Karnataka", ["bengaluru", "bangalore"]],
  ["Mumbai", "Maharashtra", ["mumbai", "navi mumbai", "thane"]],
  ["Delhi", "Delhi", ["delhi", "new delhi"]],
  ["Gurugram", "Haryana", ["gurugram", "gurgaon"]],
  ["Noida", "Uttar Pradesh", ["noida", "greater noida"]],
  ["Hyderabad", "Telangana", ["hyderabad", "secunderabad"]],
  ["Pune", "Maharashtra", ["pune"]],
  ["Chennai", "Tamil Nadu", ["chennai"]],
  ["Kolkata", "West Bengal", ["kolkata"]],
  ["Ahmedabad", "Gujarat", ["ahmedabad"]],
  ["Kochi", "Kerala", ["kochi", "cochin"]],
  ["Jaipur", "Rajasthan", ["jaipur"]],
  ["Chandigarh", "Chandigarh", ["chandigarh", "mohali"]],
  ["Indore", "Madhya Pradesh", ["indore"]],
  ["Coimbatore", "Tamil Nadu", ["coimbatore"]],
];

function indiaLocation(loc: string): { city: string; state: string | null } | null {
  const l = loc.toLowerCase();
  for (const [city, state, aliases] of CITY_TABLE) if (aliases.some((a) => l.includes(a))) return { city, state };
  if (/\bindia\b/.test(l)) return { city: "Pan-India", state: null };
  return null; // not an India role -> skip
}

function category(title: string) {
  const t = title.toLowerCase();
  const rules: [string, RegExp][] = [
    ["Data & AI", /data|machine learning|\bml\b|\bai\b|analytics|scientist/],
    ["Design", /design|ux|\bui\b|creative/],
    ["Product", /product (manager|owner|lead)|program manager/],
    ["Engineering", /engineer|developer|sre|devops|architect|qa\b|sdet|software|backend|frontend|full.?stack/],
    ["Sales", /sales|business development|account executive|customer success/],
    ["Marketing", /marketing|growth|content|seo|brand|communications/],
    ["Finance", /finance|accountant|audit|tax|treasury|risk/],
    ["HR", /recruit|talent|people|\bhr\b|human resources/],
    ["Operations", /operations|support|logistics|supply|admin/],
  ];
  return rules.find(([, re]) => re.test(t))?.[0] ?? "Other";
}

function workType(r: Raw): "Remote" | "Hybrid" | "On-site" {
  const s = `${r.workplace ?? ""} ${r.location} ${r.title}`.toLowerCase();
  if (r.remote || /remote/.test(s)) return "Remote";
  if (/hybrid/.test(s)) return "Hybrid";
  return "On-site";
}

function jobType(r: Raw): "Full-time" | "Part-time" | "Internship" {
  const s = `${r.commitment ?? ""} ${r.title}`.toLowerCase();
  if (/intern/.test(s)) return "Internship";
  if (/part.?time/.test(s)) return "Part-time";
  return "Full-time";
}

// ---------- logos (Brandfetch) ----------
async function logoFor(domain: string): Promise<string | null> {
  const key = Deno.env.get("BRANDFETCH_API_KEY"), cid = Deno.env.get("BRANDFETCH_CLIENT_ID");
  if (key) {
    try {
      const r = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, { headers: { Authorization: `Bearer ${key}` } });
      if (r.ok) {
        const b = await r.json();
        const icon = b.logos?.find((l: any) => l.type === "icon")?.formats?.find((f: any) => f.format === "png")?.src;
        if (icon) return icon;
      }
    } catch { /* fall through to CDN */ }
  }
  return cid ? `https://cdn.brandfetch.io/${domain}/w/128/h/128?c=${cid}` : null;
}

// ---------- main ----------
Deno.serve(async (req) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) return new Response("forbidden", { status: 403 });

  const { data: companies, error } = await sb.from("companies").select("id,domain,logo_url,ats_type,ats_slug")
    .or("ats_type.not.is.null,logo_url.is.null");
  if (error) return new Response(error.message, { status: 500 });

  const report: Record<string, string> = {};
  for (const c of companies ?? []) {
    try {
      if (!c.logo_url) {
        const logo = await logoFor(c.domain);
        if (logo) await sb.from("companies").update({ logo_url: logo }).eq("id", c.id);
      }
      if (!c.ats_type || !c.ats_slug) continue;

      const raws = await ADAPTERS[c.ats_type](c.ats_slug);
      const rows = raws.flatMap((r) => {
        const loc = indiaLocation(r.location);
        if (!loc || !r.url) return [];
        return [{
          company_id: c.id, title: r.title.slice(0, 200), work_type: workType(r), job_type: jobType(r),
          category: category(r.title), location_city: loc.city, location_state: loc.state,
          application_url: r.url, description: r.description, status: "active", source: "aggregator",
          external_id: r.external_id,
        }];
      });

      for (let i = 0; i < rows.length; i += 200) {
        const { error: e } = await sb.from("jobs").upsert(rows.slice(i, i + 200), { onConflict: "company_id,external_id" });
        if (e) throw e;
      }

      // Close roles that disappeared from the feed
      const live = new Set(rows.map((r) => r.external_id));
      const { data: existing } = await sb.from("jobs").select("external_id")
        .eq("company_id", c.id).eq("source", "aggregator").eq("status", "active");
      const stale = (existing ?? []).map((e) => e.external_id).filter((id) => id && !live.has(id));
      if (stale.length) await sb.from("jobs").update({ status: "closed" }).eq("company_id", c.id).in("external_id", stale);

      report[c.domain] = `${rows.length} India roles, ${stale.length} closed`;
    } catch (e) {
      report[c.domain] = `error: ${(e as Error).message}`;
    }
    await sleep(500); // be polite
  }
  return Response.json(report);
});
