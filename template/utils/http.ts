/**
 * Minimalist HTTP Client inspired by Axios.
 * Provides a lightweight, tree-shakeable wrapper around the native Fetch API.
 * Features automatic JSON parsing, payload serialization, and unified error handling.
 */

export interface HttpOptions extends Omit<RequestInit, "body"> {
  baseURL?: string;
  params?: Record<string, string | number | boolean>;
  /**
   * The request payload. If it's an object, it will be automatically
   * serialized to JSON and the Content-Type header will be set appropriately.
   */
  data?: unknown;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  url: string;
}

export class HttpError extends Error {
  public response: HttpResponse;

  constructor(message: string, response: HttpResponse) {
    super(message);
    this.name = "HttpError";
    this.response = response;
  }
}

export function createHttpClient(defaults: HttpOptions = {}) {
  async function request<T = unknown>(
    url: string,
    options: HttpOptions = {},
  ): Promise<HttpResponse<T>> {
    const baseURL = options.baseURL ?? defaults.baseURL ?? "";
    const headers = new Headers(defaults.headers);

    if (options.headers) {
      new Headers(options.headers).forEach((value, key) =>
        headers.set(key, value)
      );
    }

    const fullUrl = new URL(url, baseURL || globalThis.location?.origin);
    const params = { ...defaults.params, ...options.params };

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        fullUrl.searchParams.append(key, String(value));
      }
    }

    let body: BodyInit | null = null;
    if (options.data !== undefined) {
      if (
        options.data instanceof FormData ||
        options.data instanceof Blob ||
        options.data instanceof URLSearchParams
      ) {
        body = options.data as BodyInit;
      } else {
        body = JSON.stringify(options.data);
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
      }
    }

    const fetchOptions: RequestInit = {
      ...defaults,
      ...options,
      headers,
      body,
    };

    const response = await fetch(fullUrl.toString(), fetchOptions);

    let data;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    const payload: HttpResponse<T> = {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      url: response.url,
    };

    if (!response.ok) {
      throw new HttpError(
        `Request failed with status code ${response.status}`,
        payload,
      );
    }

    return payload;
  }

  return {
    request,
    get: <T = unknown>(url: string, options?: Omit<HttpOptions, "data">) =>
      request<T>(url, { ...options, method: "GET" }),
    post: <T = unknown>(url: string, data?: unknown, options?: HttpOptions) =>
      request<T>(url, { ...options, method: "POST", data }),
    put: <T = unknown>(url: string, data?: unknown, options?: HttpOptions) =>
      request<T>(url, { ...options, method: "PUT", data }),
    patch: <T = unknown>(url: string, data?: unknown, options?: HttpOptions) =>
      request<T>(url, { ...options, method: "PATCH", data }),
    delete: <T = unknown>(url: string, options?: Omit<HttpOptions, "data">) =>
      request<T>(url, { ...options, method: "DELETE" }),
    create: (newDefaults: HttpOptions) =>
      createHttpClient({ ...defaults, ...newDefaults }),
  };
}

export const http = createHttpClient();
