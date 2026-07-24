const VERIFICATION_ERRORS = Object.freeze({
  "auth/too-many-requests":
    "Sono stati effettuati troppi tentativi. Attendi qualche minuto e riprova.",
  "auth/network-request-failed":
    "Connessione non disponibile. Controlla la rete e riprova.",
  "auth/user-not-authenticated":
    "La sessione non è più attiva. Accedi nuovamente.",
  "auth/session-changed":
    "La sessione è cambiata durante l'operazione. Accedi nuovamente e riprova.",
  "auth/email-already-verified":
    "L'indirizzo email risulta già verificato. Aggiorna lo stato della sessione.",
});

function result(ok, code, message) {
  return { ok, code, message };
}

export function getVerificationErrorMessage(code) {
  return (
    VERIFICATION_ERRORS[code] ??
    "Non è stato possibile inviare l'email di verifica. Riprova tra poco."
  );
}

export async function requestEmailVerification({
  currentUser,
  getCurrentUser,
  sendEmail,
}) {
  if (!currentUser) {
    return result(
      false,
      "auth/user-not-authenticated",
      getVerificationErrorMessage("auth/user-not-authenticated"),
    );
  }

  if (currentUser.emailVerified === true) {
    return result(
      false,
      "auth/email-already-verified",
      getVerificationErrorMessage("auth/email-already-verified"),
    );
  }

  const sessionUid = currentUser.uid;

  if (getCurrentUser()?.uid !== sessionUid) {
    return result(
      false,
      "auth/session-changed",
      getVerificationErrorMessage("auth/session-changed"),
    );
  }

  try {
    await sendEmail(currentUser);
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "auth/verification-email-failed";

    return result(false, code, getVerificationErrorMessage(code));
  }

  if (getCurrentUser()?.uid !== sessionUid) {
    return result(
      false,
      "auth/session-changed",
      getVerificationErrorMessage("auth/session-changed"),
    );
  }

  return result(
    true,
    "verification-email-sent",
    "Email di verifica inviata. Controlla la posta e apri il link ricevuto.",
  );
}

export function maskEmail(email) {
  if (!email || !email.includes("@")) return "indirizzo associato";

  const [localPart, domain] = email.split("@");
  const domainParts = domain.split(".");
  const domainName = domainParts.shift() ?? "";
  const suffix = domainParts.length ? `.${domainParts.join(".")}` : "";

  return `${localPart.slice(0, 1)}***@${domainName.slice(0, 1)}***${suffix}`;
}

export function isVerificationActionDisabled({ sending, loading }) {
  return sending === true || loading === true;
}
