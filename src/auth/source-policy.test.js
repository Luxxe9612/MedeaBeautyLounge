import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  adminPanel: new URL("../pages/AdminMedea.jsx", import.meta.url),
  login: new URL("../pages/admin-login.jsx", import.meta.url),
  provider: new URL("./auth-provider.jsx", import.meta.url),
  context: new URL("./auth-context.js", import.meta.url),
  verification: new URL("./email-verification.js", import.meta.url),
  adminRoute: new URL("../components/admin-route.jsx", import.meta.url),
};

test("AdminMedea non duplica autenticazione o autorizzazione", async () => {
  const source = await readFile(files.adminPanel, "utf8");

  for (const forbidden of [
    "onAuthStateChanged",
    "onIdTokenChanged",
    "signInWithEmailAndPassword",
    "ALLOWED_ADMIN_EMAIL",
    "isAllowedAdmin",
    "user?.email ===",
    "user.email ===",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test("il login parte sempre con credenziali vuote", async () => {
  const source = await readFile(files.login, "utf8");
  const emptyInitialValues = source.match(/useState\(""\)/g) ?? [];

  assert.ok(emptyInitialValues.length >= 2);
  assert.equal(source.includes("ALLOWED_ADMIN_EMAIL"), false);
});

test("il provider forza il refresh durante il login ed espone refreshUserState", async () => {
  const source = await readFile(files.provider, "utf8");
  const listenerStart = source.indexOf("onIdTokenChanged");
  const listenerEnd = source.indexOf("return unsubscribe");
  const listenerSource = source.slice(listenerStart, listenerEnd);

  assert.ok(source.includes("onIdTokenChanged"));
  assert.ok(source.includes("refreshUserState"));
  assert.ok(source.includes("reloadAuthenticatedUserState"));
  assert.ok(source.includes("refreshClaims"));
  assert.equal(listenerSource.includes(".reload()"), false);
  assert.equal(listenerSource.includes("refreshUserState"), false);
  assert.ok(listenerSource.includes("forceTokenRefresh: false"));
});

test("l'email amministrativa storica non è presente nei file migrati", async () => {
  const legacyEmail = ["medeabeautylounge", "medea.com"].join("@");
  const sources = await Promise.all(
    Object.values(files).map((file) => readFile(file, "utf8")),
  );

  for (const source of sources) {
    assert.equal(source.includes(legacyEmail), false);
  }
});

test("nessun UID o account amministrativo è hardcoded nella nuova funzione", async () => {
  const forbiddenUid = ["Ndcy24LL", "ShdiHSp8", "KNEuxKtV", "iOv2"].join("");
  const legacyEmail = ["medeabeautylounge", "medea.com"].join("@");
  const sources = await Promise.all(
    [
      files.provider,
      files.verification,
      files.adminRoute,
    ].map((file) => readFile(file, "utf8")),
  );

  for (const source of sources) {
    assert.equal(source.includes(forbiddenUid), false);
    assert.equal(source.includes(legacyEmail), false);
  }
});

test("AdminRoute controlla loading, login ed email prima del ruolo", async () => {
  const source = await readFile(files.adminRoute, "utf8");
  const loadingCheck = source.indexOf("if (!initialized || loading)");
  const userCheck = source.indexOf("if (!user)");
  const emailCheck = source.indexOf("if (emailVerified !== true)");
  const roleCheck = source.indexOf('if (role !== "admin" || active !== true)');

  assert.ok(loadingCheck >= 0);
  assert.ok(userCheck > loadingCheck);
  assert.ok(emailCheck > userCheck);
  assert.ok(roleCheck > emailCheck);
  assert.ok(source.includes("await refreshUserState()"));
});
