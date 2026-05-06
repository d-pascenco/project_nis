const TOKEN_KEY = "nextpath_token";
const USER_KEY = "nextpath_user";

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  picture: string;
}

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); };
export const isAuthenticated = (): boolean => !!getToken();

export const getUser = (): AuthUser | null => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
};
export const setUser = (u: AuthUser) => localStorage.setItem(USER_KEY, JSON.stringify(u));

export const authHeaders = (): Record<string, string> => {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
};
