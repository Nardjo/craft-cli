import { buildAuthHeaders } from "./auth.js";
import { BASE_URL } from "./config.js";
import { CliError } from "./errors.js";
import { log } from "./logger.js";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];
const TIMEOUT_MS = 30_000;

/** HTTP methods supported by the client */
type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type ParamValue = string | number | boolean | undefined;

/** Options for an API request */
interface RequestOptions {
  params?: Record<string, ParamValue | ParamValue[]>;
  body?: unknown;
  rawBody?: BodyInit;
  headers?: Record<string, string>;
  responseType?: "json" | "text";
  timeout?: number;
}

/**
 * Make an authenticated API request with retry logic.
 * Retries on 429 (rate limit) and 5xx (server errors).
 */
async function request(method: Method, path: string, opts: RequestOptions = {}): Promise<unknown> {
  let url = `${BASE_URL}${path}`;

  if (opts.params) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(opts.params)) {
      const values = Array.isArray(value) ? value : [value];
      for (const item of values) {
        if (item !== undefined && item !== "") {
          params.append(key, String(item));
        }
      }
    }
    const query = params.toString();
    if (query) {
      url += `?${query}`;
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...buildAuthHeaders(),
    ...opts.headers,
  };

  const fetchOpts: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(opts.timeout ?? TIMEOUT_MS),
  };

  if (opts.rawBody && method !== "GET") {
    fetchOpts.body = opts.rawBody;
  } else if (opts.body !== undefined && method !== "GET") {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    fetchOpts.body = JSON.stringify(opts.body);
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    log.debug(`${method} ${url}${attempt > 0 ? ` (retry ${attempt})` : ""}`);

    const res = await fetch(url, fetchOpts);

    // Retry on rate limit or server error
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
      const delay = RETRY_DELAYS[attempt] ?? 4000;
      log.warn(`${res.status} - retrying in ${delay / 1000}s...`);
      await Bun.sleep(delay);
      continue;
    }

    const contentType = res.headers.get("content-type") ?? "";
    const data =
      opts.responseType === "text"
        ? await res.text()
        : contentType.includes("application/json")
          ? await res.json().catch(() => null)
          : await res.text().catch(() => null);

    if (!res.ok) {
      const msg =
        (data as Record<string, unknown>)?.message ??
        ((data as Record<string, Record<string, unknown>>)?.error?.message as string) ??
        res.statusText;
      throw new CliError(res.status, `${res.status}: ${String(msg)}`);
    }

    return data;
  }

  throw new CliError(500, "Max retries exceeded");
}

/** Typed HTTP client with convenience methods */
export const client = {
  /** GET request with optional query params */
  get(path: string, params?: RequestOptions["params"], opts: Omit<RequestOptions, "params"> = {}) {
    return request("GET", path, { ...opts, params });
  },

  /** POST request with JSON body */
  post(path: string, body?: unknown, opts: Omit<RequestOptions, "body"> = {}) {
    return request("POST", path, { ...opts, body });
  },

  /** POST request with a non-JSON body */
  postRaw(path: string, rawBody: BodyInit, opts: Omit<RequestOptions, "rawBody"> = {}) {
    return request("POST", path, { ...opts, rawBody });
  },

  /** POST request with JSON body */
  postJson(path: string, body?: unknown) {
    return request("POST", path, { body });
  },

  /** PATCH request with JSON body */
  patch(path: string, body?: unknown) {
    return request("PATCH", path, { body });
  },

  /** PUT request with JSON body */
  put(path: string, body?: unknown) {
    return request("PUT", path, { body });
  },

  /** DELETE request with optional JSON body */
  delete(path: string, body?: unknown) {
    return request("DELETE", path, { body });
  },
};
