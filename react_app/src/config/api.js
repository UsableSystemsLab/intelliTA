export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
export const LLM_BASE = import.meta.env.VITE_LLM_URL || 'http://localhost:8000';

export async function getAuthHeaders(user) {
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}
