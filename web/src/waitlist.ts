const BACKEND_URL = import.meta.env.VITE_MIQ_BACKEND_URL || 'http://localhost:8787';

export async function joinWaitlist(email: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/waitlist`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
