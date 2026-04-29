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
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

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
      throw new Error(this.formatErrorMessage(message, response.status));
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const text = await response.text();
    if (!text.trim()) {
      return undefined as T;
    }

    return JSON.parse(text) as T;
  }

  private formatErrorMessage(raw: string, status: number) {
    if (!raw) return this.fallbackMessage(status);
    try {
      const parsed = JSON.parse(raw);
      const message = parsed?.message;
      if (Array.isArray(message)) return this.normalizeMessage(message.join('. '), status);
      if (typeof message === 'string') return this.normalizeMessage(message, status);
      if (typeof parsed?.error === 'string') return this.normalizeMessage(parsed.error, status);
    } catch {
      // The backend may return plain text for infrastructure errors.
    }
    return this.normalizeMessage(raw, status);
  }

  private fallbackMessage(status: number) {
    if (status === 400) return 'Revisa los datos e intentalo de nuevo';
    if (status === 401 || status === 403) return 'No tienes permisos para hacer esta accion';
    if (status === 404) return 'No se encontro el recurso solicitado';
    if (status >= 500) return 'No se pudo completar la accion. Intentalo de nuevo mas tarde';
    return 'No se pudo completar la accion';
  }

  private normalizeMessage(raw: string, status: number) {
    const message = raw.trim();
    if (!message) return this.fallbackMessage(status);
    const lower = message.toLowerCase();

    if (lower.includes('must be') || lower.includes('should not') || lower.includes('property ') || lower.includes('expected')) {
      return 'Revisa los campos obligatorios y los valores introducidos';
    }
    if (lower.includes('duplicate key') || lower.includes('unique constraint') || lower.includes('23505')) {
      return 'Ya existe un registro con esos datos';
    }
    if (lower.includes('violates foreign key') || lower.includes('foreign key constraint') || lower.includes('23503')) {
      return 'No se puede borrar porque hay datos relacionados';
    }
    if (lower.includes('invalid input syntax') || lower.includes('nan')) {
      return 'Hay un valor numerico no valido';
    }

    return message.replace(/^Error:\s*/i, '');
  }
}
