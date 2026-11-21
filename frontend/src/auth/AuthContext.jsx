import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from '../api.js';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const signOutLocally = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // On first load, restore the session if we have a saved token.
  useEffect(() => {
    setUnauthorizedHandler(signOutLocally);
    if (!getToken()) {
      setReady(true);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(signOutLocally)
      .finally(() => setReady(true));
  }, [signOutLocally]);

  const value = useMemo(() => {
    const finish = ({ user: nextUser, token }) => {
      setToken(token);
      setUser(nextUser);
      return nextUser;
    };
    return {
      user,
      ready,
      login: async (body) => finish(await api.login(body)),
      register: async (body) => finish(await api.register(body)),
      guest: async () => finish(await api.guest()),
      logout: async () => {
        try {
          await api.logout();
        } catch {
          /* already signed out on the server */
        }
        signOutLocally();
      },
    };
  }, [user, ready, signOutLocally]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}