import {
  onIdTokenChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { auth } from "../firebase";
import { AuthContext } from "./auth-context";
import {
  createSingleFlight,
  readAuthenticatedUserState,
  reloadAuthenticatedUserState,
  runWithLoading,
} from "./auth-session";
import {
  requestEmailVerification,
} from "./email-verification";

const EMPTY_AUTH_STATE = {
  user: null,
  role: null,
  active: false,
  emailVerified: false,
};

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(EMPTY_AUTH_STATE);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const refreshUserFlightRef = useRef(null);
  const refreshClaimsFlightRef = useRef(null);

  if (refreshUserFlightRef.current == null) {
    refreshUserFlightRef.current = createSingleFlight();
  }

  if (refreshClaimsFlightRef.current == null) {
    refreshClaimsFlightRef.current = createSingleFlight();
  }

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      const isInitialAuthEvent = !initializedRef.current;

      if (isInitialAuthEvent) {
        setLoading(true);
      }

      if (import.meta.env.DEV && currentUser) {
        console.debug("Authenticated Firebase UID:", currentUser.uid);
      }

      try {
        if (!currentUser) {
          setAuthState(EMPTY_AUTH_STATE);
          return;
        }

        const nextState = await readAuthenticatedUserState({
          currentUser,
          getCurrentUser: () => auth.currentUser,
          forceTokenRefresh: false,
        });

        if (nextState) {
          setAuthState(nextState);
        }
      } catch (error) {
        console.error("Impossibile verificare la sessione amministrativa.", error);
        setAuthState(
          auth.currentUser
            ? {
                user: auth.currentUser,
                role: null,
                active: false,
                emailVerified: auth.currentUser.emailVerified === true,
              }
            : EMPTY_AUTH_STATE,
        );
      } finally {
        if (isInitialAuthEvent) {
          initializedRef.current = true;
          setInitialized(true);
          setLoading(false);
        }
      }
    });

    return unsubscribe;
  }, []);

  const login = useCallback(
    async (email, password) => {
      return runWithLoading(setLoading, async () => {
        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password,
        );

        const nextState = await readAuthenticatedUserState({
          currentUser: credential.user,
          getCurrentUser: () => auth.currentUser,
          forceTokenRefresh: true,
        });

        if (nextState) setAuthState(nextState);
        return nextState;
      });
    },
    [],
  );

  const logout = useCallback(async () => {
    return runWithLoading(setLoading, async () => {
      await signOut(auth);
      setAuthState(EMPTY_AUTH_STATE);
    });
  }, []);

  const refreshUserState = useCallback(() => {
    return refreshUserFlightRef.current(() => {
      return runWithLoading(setLoading, async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setAuthState(EMPTY_AUTH_STATE);
          return EMPTY_AUTH_STATE;
        }

        const nextState = await reloadAuthenticatedUserState({
          currentUser,
          getCurrentUser: () => auth.currentUser,
        });

        if (nextState) setAuthState(nextState);
        return nextState;
      });
    });
  }, []);

  const refreshClaims = useCallback(() => {
    return refreshClaimsFlightRef.current(() => {
      return runWithLoading(setLoading, async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setAuthState(EMPTY_AUTH_STATE);
          return EMPTY_AUTH_STATE;
        }

        const nextState = await readAuthenticatedUserState({
          currentUser,
          getCurrentUser: () => auth.currentUser,
          forceTokenRefresh: true,
        });

        if (nextState) setAuthState(nextState);
        return nextState;
      });
    });
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    const currentUser = auth.currentUser;

    return requestEmailVerification({
      currentUser,
      getCurrentUser: () => auth.currentUser,
      sendEmail: sendEmailVerification,
    });
  }, []);

  const value = useMemo(
    () => ({
      ...authState,
      initialized,
      loading,
      login,
      logout,
      refreshClaims,
      refreshUserState,
      sendVerificationEmail,
    }),
    [
      authState,
      initialized,
      loading,
      login,
      logout,
      refreshClaims,
      refreshUserState,
      sendVerificationEmail,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
