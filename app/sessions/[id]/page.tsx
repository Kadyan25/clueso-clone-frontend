'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AuthExtensionBridge } from '@/components/AuthExtensionBridge';


import {
  Session,
  Feedback,
  listSessions,
  listFeedbacks,
  addFeedback,
  processSession,
  listExtensionEvents,
  ExtensionEvent,
} from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function SessionDetailPage() {
  const params = useParams();
  const token = useAuthStore((s) => s.token);
  const sessionId = Number(params?.id);

  const [session, setSession] = useState<Session | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [extensionEvents, setExtensionEvents] = useState<ExtensionEvent[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await listSessions(token ?? undefined);
        const found = all.find((s) => s.id === sessionId) || null;
        setSession(found || null);

        if (found) {
          const [fb, events] = await Promise.all([
            listFeedbacks(sessionId, token ?? undefined),
            listExtensionEvents(sessionId, token ?? undefined),
          ]);
          setFeedbacks(fb);
          setExtensionEvents(events);
        }
      } finally {
        setLoading(false);
      }
    };
    if (!Number.isNaN(sessionId) && token) {
      load();
    }
  }, [sessionId, token]);

  const handleProcess = async () => {
    if (!session) return;
    const updated = await processSession(session.id, token ?? undefined);
    setSession((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  const handleSubmitFeedback = async () => {
    const text = feedbackInput.trim();
    if (!text || !session) return;
    try {
      setSavingFeedback(true);
      const fb = await addFeedback(session.id, text, token ?? undefined);
      setFeedbacks((prev) => [fb, ...prev]);
      setFeedbackInput('');
    } finally {
      setSavingFeedback(false);
    }
  };

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <AuthExtensionBridge />
        <p className="text-sm text-slate-400">
          You must be logged in to view this session.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading session…</p>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">Session not found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="mx-auto max-w-4xl">

        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {session.name}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Created at {new Date(session.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide
                ${
                  session.status === 'READY'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : session.status === 'PROCESSING'
                    ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                    : 'border-slate-600 bg-slate-800 text-slate-200'
                }`}
            >
              {session.status}
            </span>
            <button
              onClick={handleProcess}
              className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-slate-50 hover:bg-blue-500"
            >
              Process with AI
            </button>
          </div>
        </header>

        {/* Script section */}
        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-2 text-sm font-medium text-slate-200">AI script</h2>
          {session.scriptText ? (
            <p className="whitespace-pre-wrap text-sm text-slate-100">
              {session.scriptText}
            </p>
          ) : (
            <p className="text-sm text-slate-400">
              Script will appear here after processing.
            </p>
          )}
        </section>

        {/* Extension events section */}
        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-2 text-sm font-medium text-slate-200">
            Extension events
          </h2>
          <p className="mb-2 text-[0.7rem] text-slate-400">
            Open this page and click the Clueso Clone Chrome extension icon to
            send page context into this session (ID {session.id}).
          </p>
          {extensionEvents.length === 0 ? (
            <p className="text-xs text-slate-500">
              No extension events yet for this session.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {extensionEvents.map((event) => (
                <li
                  key={event.id}
                  className="rounded-md bg-slate-950/60 border border-slate-800 px-3 py-2"
                >
                  <div className="text-xs text-slate-300 break-all">
                    {event.url}
                  </div>
                  <div className="mt-1 text-[0.65rem] text-slate-500">
                    {new Date(event.createdAt).toLocaleString()}
                  </div>
                  {event.steps && event.steps.length > 0 && (
                    <ul className="mt-1 list-disc list-inside text-[0.7rem] text-slate-200">
                      {event.steps.map((step, idx) => (
                        <li key={idx}>
                          {step.message ?? JSON.stringify(step)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Feedback section */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="mb-3 text-sm font-medium text-slate-200">Feedback</h2>

          <div className="space-y-2 mb-4">
            <textarea
              rows={3}
              className="w-full rounded-md bg-slate-950/70 border border-slate-800 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Add feedback about this script…"
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
            />
            <button
              onClick={handleSubmitFeedback}
              disabled={savingFeedback}
              className={`inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium
                ${
                  savingFeedback
                    ? 'cursor-not-allowed bg-slate-700 text-slate-300'
                    : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                }`}
            >
              {savingFeedback ? 'Saving…' : 'Save feedback'}
            </button>
          </div>

          {feedbacks.length === 0 ? (
            <p className="text-xs text-slate-500">
              No feedback yet. Add the first review for this script.
            </p>
          ) : (
            <div className="space-y-2">
              {feedbacks.map((fb) => (
                <div
                  key={fb.id}
                  className="rounded-md bg-slate-950/60 border border-slate-800 px-2 py-1.5"
                >
                  <p className="text-xs text-slate-100">{fb.text}</p>
                  <p className="mt-1 text-[0.6rem] text-slate-500">
                    {new Date(fb.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
