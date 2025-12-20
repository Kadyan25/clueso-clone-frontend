// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
      <div className="max-w-md w-full px-4 text-center">
        <h1 className="text-2xl font-semibold mb-2">Clueso Clone</h1>
        <p className="text-sm text-slate-400 mb-6">
          Record walkthrough sessions, process them with AI, and capture feedback.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-slate-50 hover:bg-blue-500"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800"
          >
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
