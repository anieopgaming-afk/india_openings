import type { Metadata } from "next";
import { Bricolage_Grotesque, Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const body = Source_Sans_3({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "India Openings: jobs at real Indian companies",
  description: "Search open roles across Bengaluru, Mumbai, Delhi-NCR, Hyderabad, Pune, Chennai and more. Apply directly on the company's careers page.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen antialiased">
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="display text-xl font-bold text-forest">India Openings</Link>
            <nav className="flex items-center gap-4 text-sm font-semibold">
              <Link href="/login" className="text-soft hover:text-ink">Log in</Link>
              <Link href="/employer" className="rounded-md bg-marigold px-3 py-2 text-ink hover:brightness-95">Post a job</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mx-auto max-w-5xl px-4 py-10 text-sm text-soft">
          Applications open on each company&apos;s own careers page. Verified means the employer confirmed a work email on its company domain.
        </footer>
      </body>
    </html>
  );
}
