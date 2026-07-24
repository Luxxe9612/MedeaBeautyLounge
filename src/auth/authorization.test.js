import assert from "node:assert/strict";
import test from "node:test";

import {
  authStateFromToken,
  getAdminAccessState,
  isActiveAdmin,
} from "./authorization.js";

const verifiedUser = {
  uid: "test-user",
  email: "owner@example.invalid",
  emailVerified: true,
};

function state(overrides = {}) {
  return {
    user: verifiedUser,
    role: "admin",
    active: true,
    emailVerified: true,
    initialized: true,
    ...overrides,
  };
}

test("nega l'accesso mentre la sessione non è inizializzata", () => {
  assert.equal(
    getAdminAccessState(state({ initialized: false })),
    "initializing",
  );
});

test("mantiene il caricamento mentre AuthProvider sta aggiornando lo stato", () => {
  assert.equal(
    getAdminAccessState(state({ loading: true })),
    "initializing",
  );
});

test("nega l'accesso a un visitatore anonimo", () => {
  assert.equal(
    getAdminAccessState(
      state({
        user: null,
        role: null,
        active: false,
        emailVerified: false,
      }),
    ),
    "unauthenticated",
  );
});

test("nega l'accesso a un account con email non verificata", () => {
  assert.equal(
    getAdminAccessState(state({
      emailVerified: false,
      role: null,
      active: false,
    })),
    "email-unverified",
  );
});

for (const [label, overrides] of [
  ["senza ruolo", { role: null }],
  ["client", { role: "client" }],
  ["staff", { role: "staff" }],
  ["admin inattivo", { active: false }],
]) {
  test(`nega l'accesso a un account ${label}`, () => {
    assert.equal(getAdminAccessState(state(overrides)), "unauthorized");
    assert.equal(isActiveAdmin(state(overrides)), false);
  });
}

test("consente l'accesso solo a un admin attivo con email verificata", () => {
  assert.equal(getAdminAccessState(state()), "authorized");
  assert.equal(isActiveAdmin(state()), true);
});

test("l'indirizzo email non concede privilegi senza claim", () => {
  const accountWithoutClaims = state({
    user: { ...verifiedUser, email: "administrator@example.invalid" },
    role: null,
    active: false,
  });

  assert.equal(getAdminAccessState(accountWithoutClaims), "unauthorized");
});

test("mappa i claim del token nello stato usato dopo refreshClaims", () => {
  assert.deepEqual(
    authStateFromToken(verifiedUser, {
      claims: { role: "admin", active: true },
    }),
    {
      user: verifiedUser,
      role: "admin",
      active: true,
      emailVerified: true,
    },
  );
});

test("claim assenti o non validi non vengono promossi", () => {
  assert.deepEqual(
    authStateFromToken(verifiedUser, {
      claims: { role: "owner", active: "true" },
    }),
    {
      user: verifiedUser,
      role: null,
      active: false,
      emailVerified: true,
    },
  );
});
