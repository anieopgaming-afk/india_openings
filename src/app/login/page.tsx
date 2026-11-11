import Link from "next/link";
import { login } from "../employer/actions";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { error, notice } = await searchParams;
  const input = "mt-1 w-full rounded-md border border-line bg-white px-3 py-2";
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="display text-3xl font-bold">Employer log in</h1>
      {notice && <p className="mt-4 rounded-md bg-mist p-3 text-sm" role="status">{notice}</p>}
      {error && <p className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm" role="alert">{error}</p>}
      <form action={login} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">Work email<input name="email" type="email" required className={input} /></label>
        <label className="block text-sm font-semibold">Password<input name="password" type="password" required className={input} /></label>
        <button className="w-full rounded-md bg-forest px-4 py-2 font-semibold text-white">Log in</button>
      </form>
      <p className="mt-4 text-sm text-soft">New employer? <Link href="/employer/signup" className="font-semibold text-forest underline">Create an account</Link></p>
    </main>
  );
}
