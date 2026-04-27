/**
 * Cliente HTTP minimalista usado por `VotifyApiFacade`.
 *
 * - Centraliza el `Content-Type: application/json` y la inyección del
 *   header `x-user-id` cuando se proporciona un `userId`.
 * - Devuelve directamente el body parseado o `undefined` para 204.
 * - Promueve los errores HTTP a `Error` con el body como mensaje, para
 *   que las páginas puedan mostrarlos vía `toast.error(err.message)`.
 */
export class HttpClient {
  constructor(private readonly baseUrl: string) {}

  async get<T>(path: string, userId?: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' }, userId);
  }

  async post<T>(path: string, body?: unknown, userId?: string): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }, userId);
  }

  async patch<T>(path: string, body?: unknown, userId?: string): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }, userId);
  }

  async delete<T>(path: string, userId?: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' }, userId);
  }

  private async request<T>(path: string, init: RequestInit, userId?: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'x-user-id': userId } : {}),
        ...init.headers
      }
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Error HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}
