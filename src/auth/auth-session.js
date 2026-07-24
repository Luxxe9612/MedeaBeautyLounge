import { authStateFromToken } from "./authorization.js";

function sessionChangedError() {
  return Object.assign(
    new Error("La sessione è cambiata durante l'aggiornamento."),
    { code: "auth/session-changed" },
  );
}

function requireCurrentSession(currentUser, getCurrentUser) {
  const refreshedUser = getCurrentUser();

  if (!refreshedUser || refreshedUser.uid !== currentUser.uid) {
    throw sessionChangedError();
  }

  return refreshedUser;
}

export async function readAuthenticatedUserState({
  currentUser,
  getCurrentUser,
  forceTokenRefresh = false,
}) {
  if (!currentUser) return null;

  const tokenResult = await currentUser.getIdTokenResult(forceTokenRefresh);
  const refreshedUser = requireCurrentSession(currentUser, getCurrentUser);

  return {
    ...authStateFromToken(refreshedUser, tokenResult),
    emailVerified: refreshedUser.emailVerified === true,
  };
}

export async function reloadAuthenticatedUserState({
  currentUser,
  getCurrentUser,
}) {
  if (!currentUser) return null;

  await currentUser.reload();
  const refreshedUser = requireCurrentSession(currentUser, getCurrentUser);
  const tokenResult = await refreshedUser.getIdTokenResult(true);

  return {
    ...authStateFromToken(refreshedUser, tokenResult),
    emailVerified: refreshedUser.emailVerified === true,
  };
}

export function createSingleFlight() {
  let activeOperation = null;

  return function run(operation) {
    if (activeOperation) return activeOperation;

    activeOperation = Promise.resolve()
      .then(operation)
      .finally(() => {
        activeOperation = null;
      });

    return activeOperation;
  };
}

export async function runWithLoading(setLoading, operation) {
  setLoading(true);

  try {
    return await operation();
  } finally {
    setLoading(false);
  }
}
