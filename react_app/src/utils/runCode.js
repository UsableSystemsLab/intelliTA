import { API_BASE, getAuthHeaders } from '../config/api';
import { auth } from './firebase.js';

export async function runCode({ courseId, activityId, files, language, version, stdin }) {
  const url = `${API_BASE}/courses/${courseId}/activities/${activityId}/run`;

  const headers = {
    'Content-Type': 'application/json',
    ...(await getAuthHeaders(auth.currentUser)),
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      files: files.map((f) => ({ name: f.name, content: f.content })),
      language,
      version,
      stdin: stdin || '',
    }),
  });

  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || 'Slow down — wait a moment before running again');
    err.code = 'RATE_LIMITED';
    throw err;
  }
  if (res.status === 503) {
    const err = new Error('Code runner unavailable — try again shortly');
    err.code = 'UNAVAILABLE';
    throw err;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Run failed (${res.status})`);
  }

  return res.json();
}
