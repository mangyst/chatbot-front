import { useErrorStore } from './errorStore';

export async function apiRequest(url, options = {}) {
  const { setError } = useErrorStore.getState();

  try {
    const res = await fetch(url, { credentials: 'include', ...options });

    if (!res.ok) {
      let message;
      try {
        const data = await res.json();
        message = data.detail || JSON.stringify(data);
      } catch {
        // если не JSON — берём текст
        message = await res.text();
      }
      throw new Error(message || res.statusText);
    }

    return await res.json();
  } catch (err) {
    setError(err.message || 'Произошла ошибка запроса');
    throw err;
  }
}
