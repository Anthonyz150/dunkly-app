export function saveToLocal<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("saveToLocal error:", error);
  }
}

export function getFromLocal<T = unknown>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : null;
  } catch (error) {
    console.error("getFromLocal error:", error);
    return null;
  }
}
