#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { blocksResource } from "./resources/blocks.js";
import { collectionItemsResource } from "./resources/collection-items.js";
import { collectionViewsResource } from "./resources/collection-views.js";
import { collectionsResource } from "./resources/collections.js";
import { commentsResource } from "./resources/comments.js";
import { connectionResource } from "./resources/connection.js";
import { documentsResource } from "./resources/documents.js";
import { foldersResource } from "./resources/folders.js";
import { tasksResource } from "./resources/tasks.js";
import { uploadResource } from "./resources/upload.js";
import { whiteboardsResource } from "./resources/whiteboards.js";

const program = new Command();

program
  .name("craft-cli")
  .description("CLI for the Craft Space API")
  .version("0.1.0")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json, csv, yaml", "text")
  .option("--verbose", "Enable debug logging", false)
  .option("--no-color", "Disable colored output")
  .option("--no-header", "Omit table/csv headers (for piping)")
  .hook("preAction", (_thisCmd, actionCmd) => {
    const root = actionCmd.optsWithGlobals();
    globalFlags.json = root.json ?? false;
    globalFlags.format = root.format ?? "text";
    globalFlags.verbose = root.verbose ?? false;
    globalFlags.noColor = root.color === false;
    globalFlags.noHeader = root.header === false;
  });

// Built-in commands
program.addCommand(authCommand);

// Craft API resources
program.addCommand(blocksResource);
program.addCommand(collectionItemsResource);
program.addCommand(collectionViewsResource);
program.addCommand(collectionsResource);
program.addCommand(commentsResource);
program.addCommand(connectionResource);
program.addCommand(documentsResource);
program.addCommand(foldersResource);
program.addCommand(tasksResource);
program.addCommand(uploadResource);
program.addCommand(whiteboardsResource);

program.parse();
