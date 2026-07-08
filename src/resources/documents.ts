import { Command } from "commander";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import {
  csv,
  destinationFrom,
  paramsFrom,
  readJsonPayload,
  requireJsonPayload,
  writeOutput,
  type BodyOpts,
  type OutputOpts,
} from "../lib/payload.js";

interface ListOpts extends OutputOpts {
  location?: string;
  folderId?: string;
  fetchMetadata?: boolean;
  createdDateGte?: string;
  createdDateLte?: string;
  lastModifiedDateGte?: string;
  lastModifiedDateLte?: string;
  dailyNoteDateGte?: string;
  dailyNoteDateLte?: string;
}

interface SearchOpts extends OutputOpts {
  include?: string;
  regexps?: string;
  documentIds?: string;
  fetchBlocks?: boolean;
  location?: string;
  folderIds?: string;
  createdDateGte?: string;
  createdDateLte?: string;
  lastModifiedDateGte?: string;
  lastModifiedDateLte?: string;
  dailyNoteDateGte?: string;
  dailyNoteDateLte?: string;
}

interface CreateOpts extends OutputOpts, BodyOpts {
  title?: string;
  titles?: string;
  folderId?: string;
  destination?: string;
}

interface DeleteOpts extends OutputOpts, BodyOpts {
  ids?: string;
}

interface MoveOpts extends OutputOpts, BodyOpts {
  ids?: string;
  folderId?: string;
  destination?: string;
}

export const documentsResource = new Command("documents").description(
  "List, search, create, move, and delete Craft documents",
);

documentsResource
  .command("list")
  .description("List documents in the space")
  .option("--location <location>", "Virtual location: unsorted, trash, templates, or daily_notes")
  .option("--folder-id <id>", "Folder ID to list recursively")
  .option("--fetch-metadata", "Include lastModifiedAt and createdAt")
  .option("--created-date-gte <date>", "Only include documents created on or after this date")
  .option("--created-date-lte <date>", "Only include documents created on or before this date")
  .option("--last-modified-date-gte <date>", "Only include documents modified on or after this date")
  .option("--last-modified-date-lte <date>", "Only include documents modified on or before this date")
  .option("--daily-note-date-gte <date>", "Only include daily notes on or after this date")
  .option("--daily-note-date-lte <date>", "Only include daily notes on or before this date")
  .option("--fields <cols>", "Comma-separated fields to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  craft-cli documents list --location unsorted --json\n  craft-cli documents list --folder-id folder-123 --fetch-metadata --json",
  )
  .action(async (opts: ListOpts) => {
    try {
      const data = await client.get(
        "/documents",
        paramsFrom(opts, [
          ["location", "location"],
          ["folderId", "folderId"],
          ["fetchMetadata", "fetchMetadata"],
          ["createdDateGte", "createdDateGte"],
          ["createdDateLte", "createdDateLte"],
          ["lastModifiedDateGte", "lastModifiedDateGte"],
          ["lastModifiedDateLte", "lastModifiedDateLte"],
          ["dailyNoteDateGte", "dailyNoteDateGte"],
          ["dailyNoteDateLte", "dailyNoteDateLte"],
        ]),
      );
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

documentsResource
  .command("search")
  .description("Search content across documents")
  .option("--include <terms>", "Search terms to include")
  .option("--regexps <patterns>", "RE2-compatible regex patterns")
  .option("--document-ids <ids>", "Document IDs to filter")
  .option("--fetch-blocks", "Include full matched blocks")
  .option("--location <location>", "Virtual location filter")
  .option("--folder-ids <ids>", "Folder IDs to search recursively")
  .option("--created-date-gte <date>", "Only include documents created on or after this date")
  .option("--created-date-lte <date>", "Only include documents created on or before this date")
  .option("--last-modified-date-gte <date>", "Only include documents modified on or after this date")
  .option("--last-modified-date-lte <date>", "Only include documents modified on or before this date")
  .option("--daily-note-date-gte <date>", "Only include daily notes on or after this date")
  .option("--daily-note-date-lte <date>", "Only include daily notes on or before this date")
  .option("--fields <cols>", "Comma-separated fields to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExamples:\n  craft-cli documents search --include "API" --json\n  craft-cli documents search --regexps "project|roadmap" --fetch-blocks --json',
  )
  .action(async (opts: SearchOpts) => {
    try {
      const data = await client.get(
        "/documents/search",
        paramsFrom(opts, [
          ["include", "include"],
          ["regexps", "regexps"],
          ["documentIds", "documentIds"],
          ["fetchBlocks", "fetchBlocks"],
          ["location", "location"],
          ["folderIds", "folderIds"],
          ["createdDateGte", "createdDateGte"],
          ["createdDateLte", "createdDateLte"],
          ["lastModifiedDateGte", "lastModifiedDateGte"],
          ["lastModifiedDateLte", "lastModifiedDateLte"],
          ["dailyNoteDateGte", "dailyNoteDateGte"],
          ["dailyNoteDateLte", "dailyNoteDateLte"],
        ]),
      );
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

documentsResource
  .command("create")
  .description("Create one or more documents")
  .option("--title <title>", "Document title")
  .option("--titles <titles>", "Comma-separated document titles")
  .option("--folder-id <id>", "Destination folder ID")
  .option("--destination <location>", "Destination location: unsorted or templates")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExamples:\n  craft-cli documents create --title "Project Plan" --json\n  craft-cli documents create --titles "One,Two" --folder-id folder-123 --json',
  )
  .action(async (opts: CreateOpts) => {
    try {
      const titles = opts.titles ? csv(opts.titles, "titles") : opts.title ? [opts.title] : undefined;
      const fallback = titles
        ? {
            documents: titles.map((title) => ({ title })),
            ...(opts.folderId || opts.destination ? { destination: destinationFrom(opts) } : {}),
          }
        : undefined;
      const data = await client.post("/documents", requireJsonPayload(opts, fallback));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

documentsResource
  .command("delete")
  .description("Soft-delete documents by moving them to trash")
  .option("--ids <ids>", "Comma-separated document IDs")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  craft-cli documents delete --ids doc-123,doc-456 --json")
  .action(async (opts: DeleteOpts) => {
    try {
      const payload = readJsonPayload(opts) ?? { documentIds: csv(opts.ids, "ids") };
      const data = await client.delete("/documents", payload);
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });

documentsResource
  .command("move")
  .description("Move documents to a folder or built-in location")
  .option("--ids <ids>", "Comma-separated document IDs")
  .option("--folder-id <id>", "Destination folder ID")
  .option("--destination <location>", "Destination location, usually unsorted or templates")
  .option("--body <json>", "Raw JSON request body")
  .option("--body-file <path>", "Read JSON request body from a file, or '-' for stdin")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  craft-cli documents move --ids doc-123 --folder-id folder-456 --json\n  craft-cli documents move --ids doc-123 --destination unsorted --json",
  )
  .action(async (opts: MoveOpts) => {
    try {
      const fallback = opts.ids
        ? { documentIds: csv(opts.ids, "ids"), destination: destinationFrom(opts) }
        : undefined;
      const data = await client.put("/documents/move", requireJsonPayload(opts, fallback));
      writeOutput(data, opts);
    } catch (err) {
      handleError(err, opts.json);
    }
  });
