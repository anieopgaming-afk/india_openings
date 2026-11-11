import Link from "next/link";
import { signupEmployer } from "../actions";

export default async function Signup({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const input = "mt-1 w-full rounded-md border border-line bg-white px-3 py-2";
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="display text-3xl font-bold">Post jobs as an employer</h1>
      <p className="mt-2 text-sm text-soft">Sign up with your official work email. Gmail, Yahoo and other free addresses are blocked.</p>
      {error && <p className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm" role="alert">{error}</p>}
      <form action={signupEmployer} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">Company name<input name="company_name" required className={input} /></label>
        <label className="block text-sm font-semibold">Work email<input name="email" type="email" required placeholder="you@yourcompany.com" className={input} /></label>
        <label className="block text-sm font-semibold">Password<input name="password" type="password" minLength={8} required className={input} /></label>
        <fieldset className="rounded-md border border-line bg-white p-3">
          <legend className="px-1 text-sm font-semibold">Optional: corporate ID</legend>
          <p className="text-xs text-soft">Adding a GSTIN or CIN lets us mark your company Verified once your email is confirmed.</p>
          <label className="mt-2 block text-sm font-semibold">GSTIN<input name="gstin" maxLength={15} className={input} /></label>
          <label className="mt-2 block text-sm font-semibold">CIN<input name="cin" maxLength={21} className={input} /></label>
        </fieldset>
        <button className="w-full rounded-md bg-forest px-4 py-2 font-semibold text-white">Create employer account</button>
      </form>
      <p className="mt-4 text-sm text-soft">Already registered? <Link href="/login" className="font-semibold text-forest underline">Log in</Link></p>
    </main>
  );
}
