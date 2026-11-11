"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, CITIES, JOB_TYPES, STATES, WORK_TYPES } from "@/lib/constants";

const MAX_LPA = 50;

export default function SearchFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [minL, setMinL] = useState(sp.get("smin") ? Number(sp.get("smin")) / 100000 : 0);
  const [maxL, setMaxL] = useState(sp.get("smax") ? Number(sp.get("smax")) / 100000 : MAX_LPA);

  function push(patch: Record<string, string | null>) {
    const p = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    p.delete("page");
    router.push(`/?${p}`, { scroll: false });
  }

  // Salary slider: apply 400ms after the person stops dragging
  useEffect(() => {
    const t = setTimeout(() => {
      const smin = minL > 0 ? String(minL * 100000) : null;
      const smax = maxL < MAX_LPA ? String(maxL * 100000) : null;
      if ((sp.get("smin") ?? null) !== smin || (sp.get("smax") ?? null) !== smax) push({ smin, smax });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minL, maxL]);

  const suggestions = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const items = [
      ...CITIES.filter((c) => c.city !== "Pan-India").map((c) => ({ label: c.city, sub: c.state })),
      ...STATES.map((st) => ({ label: st, sub: "State" })),
    ];
    return items.filter((i) => i.label.toLowerCase().split(/\s+/).some((w) => w.startsWith(s))).slice(0, 7);
  }, [q]);

  function choose(label: string) { setQ(label); setOpen(false); setActive(-1); push({ q: label }); }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Escape") setOpen(false);
    else if (e.key === "Enter") { e.preventDefault(); active >= 0 && suggestions[active] ? choose(suggestions[active].label) : (setOpen(false), push({ q: q.trim() || null })); }
  }

  const sel = "w-full rounded-md border border-line bg-white px-3 py-2 text-sm";

  return (
    <section aria-label="Search and filters" className="space-y-4">
      <div className="relative">
        <label htmlFor="q" className="sr-only">Search by city, state or job title</label>
        <input id="q" value={q} autoComplete="off" role="combobox" aria-expanded={open} aria-controls="city-list"
          placeholder="Search a city, state or job title, e.g. Pune or React"
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
          onKeyDown={onKey} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)}
          className="w-full rounded-lg border-2 border-ink/80 bg-white px-4 py-3 text-base shadow-sm" />
        {open && suggestions.length > 0 && (
          <ul id="city-list" role="listbox" className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-line bg-white shadow-lg">
            {suggestions.map((s, i) => (
              <li key={s.label} role="option" aria-selected={i === active}
                onMouseDown={() => choose(s.label)}
                className={`flex cursor-pointer justify-between px-4 py-2 text-sm ${i === active ? "bg-mist" : ""}`}>
                <span className="font-semibold">{s.label}</span><span className="text-soft">{s.sub}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-semibold">Work mode
          <select className={sel} value={sp.get("work") ?? ""} onChange={(e) => push({ work: e.target.value || null })}>
            <option value="">Any</option>{WORK_TYPES.map((w) => <option key={w}>{w}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Job type
          <select className={sel} value={sp.get("type") ?? ""} onChange={(e) => push({ type: e.target.value || null })}>
            <option value="">Any</option>{JOB_TYPES.map((w) => <option key={w}>{w}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Category
          <select className={sel} value={sp.get("cat") ?? ""} onChange={(e) => push({ cat: e.target.value || null })}>
            <option value="">All categories</option>{CATEGORIES.map((w) => <option key={w}>{w}</option>)}
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm font-semibold">
          <input type="checkbox" className="h-5 w-5 accent-[var(--color-forest)]" checked={sp.get("verified") === "1"}
            onChange={(e) => push({ verified: e.target.checked ? "1" : null })} />
          Verified companies only
        </label>
      </div>

      <fieldset className="rounded-lg border border-line bg-white p-3">
        <legend className="px-1 text-sm font-semibold">
          Salary: ₹{minL} LPA to {maxL >= MAX_LPA ? `₹${MAX_LPA}+ LPA` : `₹${maxL} LPA`}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-soft">Minimum
            <input type="range" min={0} max={MAX_LPA} step={1} value={minL} className="w-full"
              onChange={(e) => setMinL(Math.min(Number(e.target.value), maxL))} />
          </label>
          <label className="text-xs text-soft">Maximum
            <input type="range" min={0} max={MAX_LPA} step={1} value={maxL} className="w-full"
              onChange={(e) => setMaxL(Math.max(Number(e.target.value), minL))} />
          </label>
        </div>
        <p className="mt-1 text-xs text-soft">Roles without a listed salary stay in the results.</p>
      </fieldset>

      {sp.toString() && (
        <button type="button" className="text-sm font-semibold text-forest underline"
          onClick={() => { setQ(""); setMinL(0); setMaxL(MAX_LPA); router.push("/"); }}>Clear all filters</button>
      )}
    </section>
  );
}
