// Thin fetch wrappers around the gamification backend (rewards, badges,
// notifications, gamified submissions). Every function takes the Firebase
// `user` object (pass `auth.currentUser`, not the merged app-state user, since
// spreading a Firebase user loses its getIdToken method) so it can build auth
// headers via getAuthHeaders, mirroring the rest of src/config/api.js.
import { API_BASE, getAuthHeaders } from "@/config/api";

async function request(user, path, { method = "GET", body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(await getAuthHeaders(user)),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  // 204 / empty bodies (e.g. nothing to mark read) — return null gracefully.
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

function query(params) {
  const usp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") usp.append(k, v);
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}

// --- Rewards & badges ---

export function getRewardsSummary(user, userId) {
  return request(user, `/users/${userId}/rewards`);
}

export function getRewardsHistory(user, userId, { limit, cursor } = {}) {
  return request(user, `/users/${userId}/rewards/history${query({ limit, cursor })}`);
}

export function getBadges(user, userId) {
  return request(user, `/users/${userId}/badges`);
}

export function awardBugHunter(user, { user_id, activity_id, reason }) {
  return request(user, `/badges/bug-hunter`, {
    method: "POST",
    body: { user_id, activity_id, reason },
  });
}

// --- Notifications ---

export function listNotifications(user, userId, { limit, cursor, unread_only } = {}) {
  return request(
    user,
    `/users/${userId}/notifications${query({ limit, cursor, unread_only })}`,
  );
}

export function getUnreadCount(user, userId) {
  return request(user, `/users/${userId}/notifications/unread-count`);
}

export function markNotificationRead(user, id) {
  return request(user, `/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllRead(user) {
  return request(user, `/notifications/read-all`, { method: "POST" });
}

// --- Gamified submission & instructor config ---

export function submitActivityV2(user, courseId, activityId, body) {
  return request(
    user,
    `/courses/${courseId}/activities/${activityId}/submissions`,
    { method: "POST", body },
  );
}

export function setActivityCodeTests(user, courseId, activityId, test_names) {
  return request(
    user,
    `/courses/${courseId}/activities/${activityId}/code-tests`,
    { method: "PUT", body: { test_names } },
  );
}
