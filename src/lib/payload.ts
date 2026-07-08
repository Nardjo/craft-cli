import { readFileSync } from "fs";
import { CliError } from "./errors.js";
import { output } from "./output.js";

export interface BodyOpts {
  body?: string;
  bodyFile?: string;
}

export interface OutputOpts {
  json?: boolean;
  format?: string;
  fields?: string;
}

type JsonObject = Record<string, unknown>;
type ParamValue = string | number | boolean | undefined;

export function readJsonPayload(opts: BodyOpts): JsonObject | undefined {
  if (opts.body && opts.bodyFile) {
    throw new CliError(2, "Use either --body or --body-file, not both.");
  }

  const raw = opts.body ?? readBodyFile(opts.bodyFile);
  if (raw === undefined) return undefined;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isJsonObject(parsed)) {
      throw new Error("expected a JSON object");
    }
    return parsed;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new CliError(2, `Invalid JSON payload: ${message}`);
  }
}

export function requireJsonPayload(opts: BodyOpts, fallback?: JsonObject): JsonObject {
  const payload = readJsonPayload(opts) ?? fallback;
  if (!payload) {
    throw new CliError(2, "Provide --body, --body-file, or the required convenience flags.");
  }
  return payload;
}

export function csv(value: string | undefined, name: string): string[] {
  const items = value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!items?.length) {
    throw new CliError(2, `Provide --${name} with at least one comma-separated value.`);
  }

  return items;
}

export function paramsFrom<T extends object>(
  opts: T,
  mappings: Array<[keyof T, string]>,
): Record<string, ParamValue> {
  const params: Record<string, ParamValue> = {};
  for (const [optionKey, paramKey] of mappings) {
    const value = opts[optionKey] as ParamValue;
    if (value !== undefined && value !== "") {
      params[paramKey] = value;
    }
  }
  return params;
}

export function positionFrom(opts: {
  position?: string;
  pageId?: string;
  date?: string;
  siblingId?: string;
}): JsonObject {
  const position = opts.position ?? "end";
  const result: JsonObject = { position };

  if (opts.siblingId) {
    result.siblingId = opts.siblingId;
  } else if (opts.date) {
    result.date = opts.date;
  } else if (opts.pageId) {
    result.pageId = opts.pageId;
  } else {
    throw new CliError(2, "Provide --page-id, --date, or --sibling-id for the position.");
  }

  return result;
}

export function destinationFrom(opts: { folderId?: string; destination?: string }): JsonObject {
  if (opts.folderId) return { folderId: opts.folderId };
  if (opts.destination) return { destination: opts.destination };
  throw new CliError(2, "Provide --folder-id or --destination.");
}

export function writeOutput(data: unknown, opts: OutputOpts): void {
  output(data, {
    json: opts.json,
    format: opts.format,
    fields: opts.fields?.split(",").map((field) => field.trim()).filter(Boolean),
  });
}

function readBodyFile(path: string | undefined): string | undefined {
  if (!path) return undefined;
  return readFileSync(path === "-" ? 0 : path, "utf8");
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
