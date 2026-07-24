import { useState } from "react";

import { useAuth } from "../auth/auth-context";

const LOGIN_ERRORS = {
  "auth/invalid-credential": "Email o password non corretti.",
  "auth/invalid-email": "Inserisci un indirizzo email valido.",
  "auth/missing-password": "Inserisci la password.",
  "auth/network-request-failed":
    "Connessione non disponibile. Controlla la rete e riprova.",
  "auth/too-many-requests":
    "Troppi tentativi. Attendi qualche minuto prima di riprovare.",
  "auth/user-disabled": "Questo account è stato disattivato.",
};

function getLoginError(error) {
  return (
    LOGIN_ERRORS[error?.code] ??
    "Non è stato possibile accedere. Controlla i dati e riprova."
  );
}

export default function AdminLogin() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      await login(email, password);
    } catch (error) {
      setErrorMessage(getLoginError(error));
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.card} aria-labelledby="admin-login-title">
        <p style={styles.eyebrow}>Medea Beauty Lounge</p>
        <h1 id="admin-login-title" style={styles.title}>
          Accesso amministratore
        </h1>
        <p style={styles.description}>
          Inserisci le credenziali del tuo account Firebase Authentication.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={styles.input}
            />
          </label>

          {errorMessage ? (
            <p role="alert" style={styles.error}>
              {errorMessage}
            </p>
          ) : null}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Accesso in corso…" : "Accedi"}
          </button>
        </form>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "32px 20px",
    background: "linear-gradient(145deg, #fbf8f3 0%, #f3ece3 100%)",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "min(100%, 440px)",
    padding: "36px",
    borderRadius: "22px",
    background: "#fff",
    boxShadow: "0 22px 60px rgba(53, 38, 25, 0.12)",
    border: "1px solid rgba(172, 132, 80, 0.18)",
  },
  eyebrow: {
    margin: "0 0 10px",
    color: "#a47435",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    color: "#32271f",
    fontSize: "30px",
    lineHeight: 1.15,
  },
  description: {
    margin: "14px 0 28px",
    color: "#75685d",
    lineHeight: 1.55,
  },
  form: {
    display: "grid",
    gap: "18px",
  },
  label: {
    display: "grid",
    gap: "8px",
    color: "#45382e",
    fontSize: "14px",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #d9cfc5",
    borderRadius: "11px",
    color: "#30261f",
    background: "#fff",
    fontSize: "16px",
    outlineColor: "#ad7c3e",
  },
  error: {
    margin: 0,
    padding: "12px 14px",
    borderRadius: "10px",
    color: "#8f2929",
    background: "#fff0f0",
    lineHeight: 1.4,
  },
  button: {
    padding: "14px 20px",
    border: 0,
    borderRadius: "11px",
    color: "#fff",
    background: "#9b6c31",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
