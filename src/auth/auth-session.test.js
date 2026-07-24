import assert from "node:assert/strict";
import test from "node:test";

import {
  createSingleFlight,
  readAuthenticatedUserState,
  reloadAuthenticatedUserState,
  runWithLoading,
} from "./auth-session.js";

function createUser({
  emailVerified = false,
  claims = {},
  onReload = async () => {},
} = {}) {
  const calls = {
    reload: 0,
    tokenRefresh: [],
  };

  const user = {
    uid: "session-user",
    emailVerified,
    async reload() {
      calls.reload += 1;
      await onReload(user);
    },
    async getIdTokenResult(forceRefresh) {
      calls.tokenRefresh.push(forceRefresh);
      return { claims };
    },
  };

  return { calls, user };
}

test("la lettura usata da onIdTokenChanged non chiama reload", async () => {
  const { calls, user } = createUser();

  await readAuthenticatedUserState({
    currentUser: user,
    getCurrentUser: () => user,
    forceTokenRefresh: false,
  });

  assert.equal(calls.reload, 0);
  assert.deepEqual(calls.tokenRefresh, [false]);
});

test("eventi token ripetuti non generano un ciclo applicativo di reload", async () => {
  const { calls, user } = createUser();

  await readAuthenticatedUserState({
    currentUser: user,
    getCurrentUser: () => user,
  });
  await readAuthenticatedUserState({
    currentUser: user,
    getCurrentUser: () => user,
  });

  assert.equal(calls.reload, 0);
  assert.deepEqual(calls.tokenRefresh, [false, false]);
});

test("refreshUserState chiama reload e refresh forzato una sola volta", async () => {
  const { calls, user } = createUser();

  await reloadAuthenticatedUserState({
    currentUser: user,
    getCurrentUser: () => user,
  });

  assert.equal(calls.reload, 1);
  assert.deepEqual(calls.tokenRefresh, [true]);
});

test("due refresh simultanei condividono una sola operazione", async () => {
  const runOnce = createSingleFlight();
  let executions = 0;
  let releaseOperation;
  const pending = new Promise((resolve) => {
    releaseOperation = resolve;
  });

  const operation = async () => {
    executions += 1;
    await pending;
    return "done";
  };

  const first = runOnce(operation);
  const second = runOnce(operation);

  assert.equal(first, second);
  assert.equal(executions, 0);

  releaseOperation();
  assert.equal(await first, "done");
  assert.equal(executions, 1);
});

test("emailVerified obsoleto true viene corretto a false dopo reload", async () => {
  const { user } = createUser({
    emailVerified: true,
    onReload: async (currentUser) => {
      currentUser.emailVerified = false;
    },
  });

  const state = await reloadAuthenticatedUserState({
    currentUser: user,
    getCurrentUser: () => user,
  });

  assert.equal(state.emailVerified, false);
});

test("emailVerified false diventa true dopo reload", async () => {
  const { user } = createUser({
    emailVerified: false,
    onReload: async (currentUser) => {
      currentUser.emailVerified = true;
    },
  });

  const state = await reloadAuthenticatedUserState({
    currentUser: user,
    getCurrentUser: () => user,
  });

  assert.equal(state.emailVerified, true);
});

test("role e active vengono aggiornati dal token", async () => {
  const { user } = createUser({
    emailVerified: true,
    claims: { role: "admin", active: true },
  });

  const state = await readAuthenticatedUserState({
    currentUser: user,
    getCurrentUser: () => user,
    forceTokenRefresh: true,
  });

  assert.equal(state.role, "admin");
  assert.equal(state.active, true);
  assert.equal(state.emailVerified, true);
});

test("refreshClaims forza il token senza chiamare reload", async () => {
  const { calls, user } = createUser();

  await readAuthenticatedUserState({
    currentUser: user,
    getCurrentUser: () => user,
    forceTokenRefresh: true,
  });

  assert.equal(calls.reload, 0);
  assert.deepEqual(calls.tokenRefresh, [true]);
});

test("loading torna false quando il refresh fallisce", async () => {
  const loadingStates = [];

  await assert.rejects(
    runWithLoading(
      (loading) => loadingStates.push(loading),
      async () => {
        throw new Error("reload failed");
      },
    ),
    /reload failed/,
  );

  assert.deepEqual(loadingStates, [true, false]);
});
