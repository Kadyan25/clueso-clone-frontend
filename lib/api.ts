// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

export interface Session {
  id: number;
  name: string;
  status: string;
  scriptText: string | null;
  audioFileName: string | null;
  createdAt: string;
}

export async function createSession(name: string): Promise<Session> {
  const res = await fetch(`${API_BASE_URL}/v1/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    throw new Error('Failed to create session');
  }

  return res.json();
}

export async function listSessions(): Promise<Session[]> {
  const res = await fetch(`${API_BASE_URL}/v1/sessions`);

  if (!res.ok) {
    throw new Error('Failed to fetch sessions');
  }

  return res.json();
}

export async function processSession(id: number): Promise<Session> {
  const res = await fetch(`${API_BASE_URL}/v1/sessions/${id}/process`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Failed to process session');
  }

  const data = await res.json();
  return data.session;
}
