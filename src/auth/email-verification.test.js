import assert from "node:assert/strict";
import test from "node:test";

import { getAdminAccessState } from "./authorization.js";
import {
  getVerificationErrorMessage,
  isVerificationActionDisabled,
  requestEmailVerification,
} from "./email-verification.js";

function createUser(overrides = {}) {
  return {
    uid: "generic-user",
    email: "user@example.invalid",
    emailVerified: false,
    reload: async () => {},
    getIdTokenResult: async () => ({ claims: {} }),
    ...overrides,
  };
}

test("un utente anonimo non può richiedere l'email", async () => {
  let sendCount = 0;
  const result = await requestEmailVerification({
    currentUser: null,
    getCurrentUser: () => null,
    sendEmail: async () => {
      sendCount += 1;
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "auth/user-not-authenticated");
  assert.equal(sendCount, 0);
});

test("un utente autenticato non verificato può richiedere l'email", async () => {
  const user = createUser();
  let sendCount = 0;
  const result = await requestEmailVerification({
    currentUser: user,
    getCurrentUser: () => user,
    sendEmail: async (recipient) => {
      assert.equal(recipient, user);
      sendCount += 1;
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.code, "verification-email-sent");
  assert.equal(sendCount, 1);
});

test("un utente già verificato non riceve un invio non necessario", async () => {
  const user = createUser({ emailVerified: true });
  let sendCount = 0;
  const result = await requestEmailVerification({
    currentUser: user,
    getCurrentUser: () => user,
    sendEmail: async () => {
      sendCount += 1;
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "auth/email-already-verified");
  assert.equal(sendCount, 0);
});

test("una sessione cambiata durante l'invio viene segnalata", async () => {
  const user = createUser();
  const otherUser = createUser({ uid: "other-user" });
  let activeUser = user;
  const result = await requestEmailVerification({
    currentUser: user,
    getCurrentUser: () => activeUser,
    sendEmail: async () => {
      activeUser = otherUser;
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "auth/session-changed");
});

test("gli errori Firebase sono presentati in modo comprensibile", async () => {
  const user = createUser();

  for (const code of [
    "auth/too-many-requests",
    "auth/network-request-failed",
  ]) {
    const result = await requestEmailVerification({
      currentUser: user,
      getCurrentUser: () => user,
      sendEmail: async () => {
        throw { code };
      },
    });

    assert.equal(result.ok, false);
    assert.equal(result.code, code);
    assert.equal(result.message, getVerificationErrorMessage(code));
    assert.ok(result.message.length > 20);
  }
});

test("il pulsante è disabilitato durante invio o caricamento", () => {
  assert.equal(
    isVerificationActionDisabled({ sending: true, loading: false }),
    true,
  );
  assert.equal(
    isVerificationActionDisabled({ sending: false, loading: true }),
    true,
  );
  assert.equal(
    isVerificationActionDisabled({ sending: false, loading: false }),
    false,
  );
});

test("dopo la verifica l'autorizzazione viene rivalutata ma senza claim resta negata", () => {
  const accessState = getAdminAccessState({
    initialized: true,
    user: createUser({ emailVerified: true }),
    emailVerified: true,
    role: null,
    active: false,
  });

  assert.equal(accessState, "unauthorized");
});
