export const CITIES = [
  { city: "Bengaluru", state: "Karnataka" }, { city: "Mumbai", state: "Maharashtra" },
  { city: "Delhi", state: "Delhi" }, { city: "Gurugram", state: "Haryana" },
  { city: "Noida", state: "Uttar Pradesh" }, { city: "Hyderabad", state: "Telangana" },
  { city: "Pune", state: "Maharashtra" }, { city: "Chennai", state: "Tamil Nadu" },
  { city: "Kolkata", state: "West Bengal" }, { city: "Ahmedabad", state: "Gujarat" },
  { city: "Kochi", state: "Kerala" }, { city: "Jaipur", state: "Rajasthan" },
  { city: "Chandigarh", state: "Chandigarh" }, { city: "Indore", state: "Madhya Pradesh" },
  { city: "Coimbatore", state: "Tamil Nadu" }, { city: "Lucknow", state: "Uttar Pradesh" },
  { city: "Nagpur", state: "Maharashtra" }, { city: "Bhubaneswar", state: "Odisha" },
  { city: "Thiruvananthapuram", state: "Kerala" }, { city: "Vadodara", state: "Gujarat" },
  { city: "Surat", state: "Gujarat" }, { city: "Visakhapatnam", state: "Andhra Pradesh" },
  { city: "Mysuru", state: "Karnataka" }, { city: "Pan-India", state: "India" },
];
const cityNames = new Set(CITIES.map((c) => c.city));
export const STATES = [...new Set(CITIES.map((c) => c.state))].filter((s) => !cityNames.has(s) && s !== "India");

export const CATEGORIES = ["Engineering", "Data & AI", "Product", "Design", "Marketing", "Sales", "Finance", "HR", "Operations", "Other"];
export const WORK_TYPES = ["Remote", "Hybrid", "On-site"];
export const JOB_TYPES = ["Full-time", "Part-time", "Internship"];

// Mirrors public.blocked_email_domains (the database trigger is the real gate).
export const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.in", "yahoo.in", "ymail.com", "outlook.com",
  "hotmail.com", "live.com", "msn.com", "rediffmail.com", "rediff.com", "icloud.com", "me.com", "aol.com",
  "proton.me", "protonmail.com", "mail.com", "gmx.com", "yandex.com", "inbox.com", "tutanota.com",
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "sharklasers.com",
]);

// Format checks only. They do NOT prove the number exists; verify against the GST/MCA portals if you need that.
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const CIN_RE = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
