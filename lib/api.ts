// lib/api.ts
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

export interface Feedback {
  id: number;
  sessionId: number;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: number;
  name: string;
  status: string;
  scriptText: string | null;
  audioFileName: string | null;
  createdAt: string;
  updatedAt: string;
  feedbacks?: Feedback[]; // optional for convenience
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

export async function addFeedback(
  sessionId: number,
  text: string,
): Promise<Feedback> {
  const res = await fetch(`${API_BASE_URL}/v1/sessions/${sessionId}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error('Failed to create feedback');
  }

  return res.json();
}

export async function listFeedbacks(
  sessionId: number,
): Promise<Feedback[]> {
  const res = await fetch(
    `${API_BASE_URL}/v1/sessions/${sessionId}/feedback`,
  );
  if (!res.ok) {
    throw new Error('Failed to fetch feedbacks');
  }
  return res.json();
}
