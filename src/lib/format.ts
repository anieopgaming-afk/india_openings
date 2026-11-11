const lpa = (n: number) => `${+(n / 100000).toFixed(1)}`;
export function fmtSalary(min?: number | null, max?: number | null) {
  if (min && max) return `₹${lpa(min)}–${lpa(max)} LPA`;
  if (min) return `₹${lpa(min)}+ LPA`;
  if (max) return `Up to ₹${lpa(max)} LPA`;
  return null;
}
export function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d} days ago`;
  return `${Math.floor(d / 30)} mo ago`;
}
