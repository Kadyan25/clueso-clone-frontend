'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  createSession,
  listSessions,
  processSession,
  Session,
  addFeedback,
  listFeedbacks,
  Feedback,
} from '@/lib/api';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [feedbackInputs, setFeedbackInputs] = useState<Record<number, string>>(
    {},
  );
  const [feedbackLists, setFeedbackLists] = useState<
    Record<number, Feedback[]>
  >({});
  const [submittingFeedbackFor, setSubmittingFeedbackFor] = useState<
    number | null
  >(null);

  const loadSessions = async () => {
    try {
      setError(null);
      const data = await listSessions();
      setSessions(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load sessions');
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const created = await createSession(name.trim());
      setSessions((prev) => [created, ...prev]);
      setName('');
    } catch (err) {
      console.error(err);
      setError('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await processSession(id);
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updated } : s)),
      );
    } catch (err) {
      console.error(err);
      setError('Failed to process session');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackInputChange = (sessionId: number, value: string) => {
    setFeedbackInputs((prev) => ({ ...prev, [sessionId]: value }));
  };

  const handleLoadFeedbacks = async (sessionId: number) => {
    try {
      const feedbacks = await listFeedbacks(sessionId);
      setFeedbackLists((prev) => ({ ...prev, [sessionId]: feedbacks }));
    } catch (err) {
      console.error('Failed to load feedbacks', err);
    }
  };

  const handleSubmitFeedback = async (sessionId: number) => {
    const text = feedbackInputs[sessionId]?.trim();
    if (!text) return;

    try {
      setSubmittingFeedbackFor(sessionId);
      const fb = await addFeedback(sessionId, text);

      setFeedbackLists((prev) => {
        const existing = prev[sessionId] || [];
        return { ...prev, [sessionId]: [fb, ...existing] };
      });

      setFeedbackInputs((prev) => ({ ...prev, [sessionId]: '' }));
    } catch (err) {
      console.error('Failed to submit feedback', err);
    } finally {
      setSubmittingFeedbackFor(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Clueso Clone – Sessions
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Create walkthrough sessions and generate AI-style scripts.
            </p>
          </div>
        </header>

        {/* New session card */}
        <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/70">
          <h2 className="mb-3 text-sm font-medium text-slate-200">New session</h2>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Onboarding flow for new users"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition
                ${
                  loading || !name.trim()
                    ? 'cursor-not-allowed bg-slate-700 text-slate-300'
                    : 'bg-blue-600 text-slate-50 hover:bg-blue-500'
                }`}
            >
              {loading ? 'Working…' : 'Create session'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-rose-400">
              {error}
            </p>
          )}
        </section>

        {/* Sessions list card */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/70">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-200">Sessions</h2>
            {loading && (
              <span className="text-xs text-slate-400">Loading…</span>
            )}
          </div>

          {sessions.length === 0 ? (
            <p className="text-sm text-slate-400">
              No sessions yet. Create your first session above.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-lg border border-slate-800 bg-gradient-to-r p-4
                    ${
                      s.status === 'READY'
                        ? 'from-slate-900 to-emerald-900/20'
                        : s.status === 'PROCESSING'
                        ? 'from-slate-900 to-amber-900/20'
                        : 'from-slate-900 to-slate-900'
                    }`}
                >
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      {/* clickable session title → detail page */}
                      <Link href={`/sessions/${s.id}`}>
                        <div className="text-sm font-medium text-slate-100 hover:underline cursor-pointer">
                          {s.name}
                        </div>
                      </Link>
                      <div className="mt-0.5 text-xs text-slate-500">
                        Created at {new Date(s.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide
                          ${
                            s.status === 'READY'
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                              : s.status === 'PROCESSING'
                              ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                              : 'border-slate-600 bg-slate-800 text-slate-200'
                          }`}
                      >
                        {s.status}
                      </span>
                      <button
                        onClick={() => handleProcess(s.id)}
                        disabled={loading}
                        className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium transition
                          ${
                            loading
                              ? 'cursor-not-allowed bg-slate-700 text-slate-300'
                              : 'bg-blue-600 text-slate-50 hover:bg-blue-500'
                          }`}
                      >
                        {loading ? 'Processing…' : 'Process with AI'}
                      </button>
                    </div>
                  </div>

                  {s.scriptText && (
                    <div className="mt-1 text-xs text-slate-200">
                      <span className="font-semibold text-slate-400">
                        Script:{' '}
                      </span>
                      {s.scriptText}
                    </div>
                  )}

                  {/* Feedback section */}
                  <div className="mt-4 border-t border-slate-800 pt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-200">
                        Feedback
                      </h4>
                      <button
                        onClick={() => handleLoadFeedbacks(s.id)}
                        className="text-[0.7rem] text-slate-400 hover:text-slate-200"
                      >
                        Load feedback
                      </button>
                    </div>

                    <div className="space-y-2">
                      <textarea
                        className="w-full rounded-md bg-slate-950/70 border border-slate-800 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows={2}
                        placeholder="Add feedback about this script…"
                        value={feedbackInputs[s.id] || ''}
                        onChange={(e) =>
                          handleFeedbackInputChange(s.id, e.target.value)
                        }
                      />
                      <button
                        onClick={() => handleSubmitFeedback(s.id)}
                        disabled={submittingFeedbackFor === s.id}
                        className={`inline-flex items-center rounded-md px-3 py-1 text-[0.7rem] font-medium
                          ${
                            submittingFeedbackFor === s.id
                              ? 'cursor-not-allowed bg-slate-700 text-slate-300'
                              : 'bg-slate-800 text-slate-100 hover:bg-slate-700'
                          }`}
                      >
                        {submittingFeedbackFor === s.id
                          ? 'Saving…'
                          : 'Save feedback'}
                      </button>
                    </div>

                    {feedbackLists[s.id] &&
                      feedbackLists[s.id].length > 0 && (
                        <div className="mt-3 space-y-2">
                          {feedbackLists[s.id].map((fb) => (
                            <div
                              key={fb.id}
                              className="rounded-md bg-slate-950/60 border border-slate-800 px-2 py-1.5"
                            >
                              <p className="text-xs text-slate-100">
                                {fb.text}
                              </p>
                              <p className="mt-1 text-[0.6rem] text-slate-500">
                                {new Date(fb.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
