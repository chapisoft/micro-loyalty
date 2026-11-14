export const LocalStorage = {
  set(key: string, value: unknown): void {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  },

  get<T = string>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  },
};
