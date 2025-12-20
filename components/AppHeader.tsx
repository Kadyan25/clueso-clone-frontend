'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export function AppHeader() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);


  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link href="/sessions">
          <h1 className="text-2xl font-semibold tracking-tight cursor-pointer">
            Clueso Clone – Sessions
          </h1>
        </Link>
        <p className="mt-1 text-sm text-slate-400">
          Create walkthrough sessions and generate AI-style scripts.
        </p>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-300">
        {user && (
          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1">
            {user.email}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium hover:bg-slate-700"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
