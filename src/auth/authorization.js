export const ROLES = Object.freeze({
  CLIENT: "client",
  STAFF: "staff",
  ADMIN: "admin",
});

export function normalizeRole(role) {
  return Object.values(ROLES).includes(role) ? role : null;
}

export function authStateFromToken(user, tokenResult) {
  return {
    user,
    role: normalizeRole(tokenResult?.claims?.role),
    active: tokenResult?.claims?.active === true,
    emailVerified: user?.emailVerified === true,
  };
}

export function isActiveAdmin(authState) {
  return Boolean(
    authState?.user
    && authState.emailVerified === true
    && authState.role === ROLES.ADMIN
    && authState.active === true,
  );
}

export function getAdminAccessState(authState) {
  if (!authState?.initialized || authState.loading === true) {
    return "initializing";
  }
  if (!authState.user) return "unauthenticated";
  if (authState.emailVerified !== true) return "email-unverified";
  if (!isActiveAdmin(authState)) return "unauthorized";
  return "authorized";
}
