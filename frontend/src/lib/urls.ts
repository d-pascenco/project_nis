const hostname = typeof window !== "undefined" ? window.location.hostname : "";

export const IS_DEV = import.meta.env.DEV;

// Домен кабинета — my.nextpath.su
export const IS_CABINET_DOMAIN = hostname.startsWith("my.");

export const CABINET_ORIGIN: string = IS_DEV
  ? window.location.origin
  : (import.meta.env.VITE_CABINET_URL || "https://my.nextpath.su");

export const MAIN_ORIGIN: string = IS_DEV
  ? window.location.origin
  : (import.meta.env.VITE_MAIN_URL || "https://nextpath.su");

/**
 * Переход в кабинет.
 * В prod передаём token через URL-параметр ?t= —
 * localStorage не шарится между поддоменами, поэтому
 * my.nextpath.su сам сохраняет его при загрузке.
 */
export const goToCabinet = (path = "/profile", token?: string): void => {
  if (IS_DEV) {
    window.location.href = path;
    return;
  }
  const qs = token ? `?t=${encodeURIComponent(token)}` : "";
  window.location.href = CABINET_ORIGIN + path + qs;
};

/** Переход на основной сайт */
export const goToMainSite = (path = "/"): void => {
  if (IS_DEV) {
    window.location.href = path;
  } else {
    window.location.href = MAIN_ORIGIN + path;
  }
};
