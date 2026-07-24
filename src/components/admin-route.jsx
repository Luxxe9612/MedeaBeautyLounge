import { useState } from "react";

import { useAuth } from "../auth/auth-context";
import {
  isVerificationActionDisabled,
  maskEmail,
} from "../auth/email-verification";
import AdminLogin from "../pages/admin-login";

export default function AdminRoute({ children }) {
  const {
    active,
    emailVerified,
    initialized,
    loading,
    logout,
    refreshUserState,
    role,
    sendVerificationEmail,
    user,
  } = useAuth();
  const [refreshError, setRefreshError] = useState("");
  const [verificationSending, setVerificationSending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationError, setVerificationError] = useState("");

  const handleRefresh = async () => {
    setRefreshError("");

    try {
      await refreshUserState();
    } catch {
      setRefreshError(
        "Non è stato possibile aggiornare la sessione. Riprova tra poco.",
      );
    }
  };

  const handleSendVerification = async () => {
    if (
      isVerificationActionDisabled({
        sending: verificationSending,
        loading,
      })
    ) {
      return;
    }

    setVerificationSending(true);
    setVerificationMessage("");
    setVerificationError("");

    try {
      const result = await sendVerificationEmail();
      if (result.ok) {
        setVerificationMessage(result.message);
      } else {
        setVerificationError(result.message);
      }
    } catch {
      setVerificationError(
        "Non è stato possibile inviare l'email di verifica. Riprova tra poco.",
      );
    } finally {
      setVerificationSending(false);
    }
  };

  if (!initialized || loading) {
    return <StatusPage title="Verifica della sessione…" />;
  }

  if (!user) {
    return <AdminLogin />;
  }

  if (emailVerified !== true) {
    return (
      <StatusPage
        eyebrow="Verifica richiesta"
        title="Conferma il tuo indirizzo email"
        description={`Per continuare, verifica l'indirizzo ${maskEmail(user.email)} aprendo il link che riceverai via email.`}
        message={verificationMessage}
        error={verificationError || refreshError}
        actions={
          <>
            <ActionButton
              onClick={handleSendVerification}
              disabled={isVerificationActionDisabled({
                sending: verificationSending,
                loading,
              })}
            >
              {verificationSending
                ? "Invio in corso…"
                : "Invia email di verifica"}
            </ActionButton>
            <ActionButton
              onClick={handleRefresh}
              disabled={verificationSending || loading}
              secondary
            >
              Ho verificato l&apos;email
            </ActionButton>
            <ActionButton onClick={logout} secondary>
              Esci
            </ActionButton>
          </>
        }
      />
    );
  }

  if (role !== "admin" || active !== true) {
    return (
      <StatusPage
        eyebrow="Accesso negato"
        title="Account non autorizzato"
        description="La sessione è valida, ma l'account non dispone di un ruolo amministratore attivo."
        error={refreshError}
        actions={
          <>
            <ActionButton
              onClick={handleRefresh}
              disabled={loading}
            >
              Aggiorna autorizzazioni
            </ActionButton>
            <ActionButton onClick={logout} secondary>
              Esci
            </ActionButton>
          </>
        }
      />
    );
  }

  return children;
}

function StatusPage({
  eyebrow,
  title,
  description,
  message,
  error,
  actions,
}) {
  return (
    <main style={styles.page}>
      <section style={styles.card}>
        {eyebrow ? <p style={styles.eyebrow}>{eyebrow}</p> : null}
        <h1 style={styles.title}>{title}</h1>
        {description ? <p style={styles.description}>{description}</p> : null}
        {message ? (
          <p role="status" style={styles.success}>
            {message}
          </p>
        ) : null}
        {error ? (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        ) : null}
        {actions ? <div style={styles.actions}>{actions}</div> : null}
      </section>
    </main>
  );
}

function ActionButton({ secondary = false, ...props }) {
  return (
    <button
      type="button"
      {...props}
      style={{
        ...styles.button,
        ...(secondary ? styles.secondaryButton : {}),
      }}
    />
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "32px 20px",
    background: "#f7f2eb",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "min(100%, 560px)",
    boxSizing: "border-box",
    padding: "36px",
    borderRadius: "22px",
    background: "#fff",
    boxShadow: "0 22px 60px rgba(53, 38, 25, 0.11)",
    textAlign: "center",
  },
  eyebrow: {
    margin: "0 0 10px",
    color: "#9b6c31",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    color: "#33281f",
    fontSize: "30px",
  },
  description: {
    margin: "14px auto 0",
    maxWidth: "460px",
    color: "#74675d",
    lineHeight: 1.6,
  },
  error: {
    margin: "20px 0 0",
    color: "#8f2929",
  },
  success: {
    margin: "20px 0 0",
    color: "#2f6b46",
    lineHeight: 1.5,
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "26px",
  },
  button: {
    padding: "12px 18px",
    border: "1px solid #9b6c31",
    borderRadius: "10px",
    color: "#fff",
    background: "#9b6c31",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    color: "#6d4b24",
    background: "#fff",
  },
};
