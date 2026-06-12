const STORAGE_KEY = "chute_certo_remember_login";

type RememberedLogin = {
  email: string;
  password: string;
};

export function loadRememberedLogin(): RememberedLogin | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RememberedLogin;
    if (!parsed.email || !parsed.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveRememberedLogin(email: string, password: string) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ email, password })
  );
}

export function clearRememberedLogin() {
  localStorage.removeItem(STORAGE_KEY);
}
