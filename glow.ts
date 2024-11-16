#!/usr/bin/env -S deno --allow-read --allow-write=log --allow-write=out

import djot from "npm:@djot/djot";
import { format, parse } from "npm:date-fns";
import mustache from "npm:mustache";
import * as yaml from "jsr:@std/yaml";

const main = () => {
    const command = parseCommand(Deno.args);

    //console.debug(command);

    executeCommand(command);

    // console.log(djot.parse("hello _there_", { sourcePositions: true }));
};

const Dirs = {
    logs: "log",
    out: {
        root: "out",
        log: "out/log",
    },
};

type Command = "help" | "version" | "log" | "build";
type SubCommand = string;

const Templates = {
    NewLog: `---
title: 
public: no
tags:
  - 
---

D.\n`,
};

const printResult = (status: "ok", message?: string) => {
    console.log();
    console.log(`%c${status.toUpperCase()}`, "color: green");

    if (message != null) {
        console.log(`%c${message}`, "color: orange");
    }
};

const parseCommand = (
    args: string[],
): { command: Command; subCommand: SubCommand } => {
    const command = args[0] ?? null;

    // TODO check if command is valid

    const subCommand = (command != null ? args[1] : null) ?? "";

    return {
        command: command as Command,
        subCommand: subCommand as SubCommand,
    };
};

const executeCommand = (
    command: { command: Command; subCommand: SubCommand },
) => {
    switch (command.command) {
        // case "help":
        //     console.log("help");
        //     break;
        // case "version":
        //     console.log("version");
        //     break;
        case "log":
            executeLogCommand(command.subCommand);
            break;
        case "build":
            executeBuildCommand();
            break;
        default:
            Deno.exit(1);
            break;
    }
};

const executeLogCommand = (subCommand: SubCommand) => {
    switch (subCommand) {
        case "new":
            {
                let latestLogIndex = 0;
                for (const f of Deno.readDirSync(Dirs.logs)) {
                    if (!f.isFile) continue;
                    if (!f.name.endsWith(".dj")) continue;

                    const parts = f.name.split(".")[0].split("-");
                    const logIndex = Number.parseInt(parts[0]);
                    if (logIndex > latestLogIndex) {
                        latestLogIndex = logIndex;
                    }
                }

                const newIndex = String(latestLogIndex + 1).padStart(5, "0");
                const timestamp = format(new Date(), "yyyyMMddHHmm");
                const fileName = `${newIndex}-${timestamp}.dj`;
                const file = `${Dirs.logs}/${fileName}`;
                Deno.writeFileSync(
                    file,
                    new TextEncoder().encode(Templates.NewLog),
                );

                printResult("ok", fileName);
            }
            break;
        default:
            Deno.exit(1);
            break;
    }
};

const collectLogItems = () => {
    const items = [];
    for (const f of Deno.readDirSync(Dirs.logs)) {
        if (!f.isFile) continue;
        if (!f.name.endsWith(".dj")) continue;

        const sourceFileName = f.name;

        console.log(`Parsing ${sourceFileName}`);

        const file = `${Dirs.logs}/${sourceFileName}`;
        const content = Deno.readTextFileSync(file);
        const contentLines = content.split("\n");

        const headerStart = contentLines.findIndex((line) =>
            line.startsWith("---")
        ) + 1;
        const headerEnd = contentLines.slice(headerStart!).findIndex((line) =>
            line.startsWith("---")
        );

        const headerContent = contentLines.slice(headerStart!, headerEnd! + 1);
        const header = yaml.parse(headerContent.join("\n"));

        const djotContent = contentLines.slice(headerEnd! + 2).join("\n")
            .trim();

        const parsedContent = djot.parse(djotContent);
        const renderedContent = djot.renderHTML(parsedContent);

        const logNameProps = sourceFileName.substring(
            0,
            sourceFileName.lastIndexOf("."),
        ).split("-");
        const logIndex = logNameProps[0];
        const logTimestamp = logNameProps[1];
        // Timezone: UTC+1
        const logDate = parse(logTimestamp, "yyyyMMddHHmm", new Date(0));

        items.push({
            logIndex,
            logTimestamp,
            logDate,
            sourceFileName,
            header,
            contentDjot: parsedContent,
            contentHtml: renderedContent,
        });
    }
    items.sort((a, b) => b.logDate.getTime() - a.logDate.getTime());
    return items;
};

const executeBuildCommand = () => {
    const items = collectLogItems();
    console.log(`Found: ${items.length} items`);

    try {
        Deno.removeSync(Dirs.out.root, { recursive: true });
    } catch {
    } finally {
        Deno.mkdirSync(Dirs.out.root);
        Deno.mkdirSync(Dirs.out.log);
    }

    for (const item of items) {
        const header = item.header;
        //const contentDjot = item.contentDjot;
        const contentHtml = item.contentHtml;

        const itemDir = `${Dirs.out.log}/${item.logIndex}`;
        Deno.mkdirSync(itemDir);
        const file = `${itemDir}/index.html`;

        // TODO
        const pageHtml = mustache.render(
            /*html*/ `
<!DOCTYPE html>
<html>
  <head>
    <title>dector/log ~ {{title}}</title>
  </head>
  <body>
    {{{content}}}
  </body>
</html>
`,
            {
                title: header.title,
                content: contentHtml,
            },
        ).trim();

        Deno.writeTextFileSync(file, pageHtml);
    }

    // biome-ignore lint/complexity/noUselessLoneBlockStatements:
    {
        Deno.writeTextFileSync(
            `${Dirs.out.log}/index.html`,
            mustache.render(
                /*html*/ `
<!DOCTYPE html>
<html>
  <head>
    <title>dector/log</title>
  </head>
  <body>
    <ul>
      {{#items}}
      <li><a href="{{{path}}}">{{title}}</a></li>
      {{/items}}
    </ul>
  </body>
</html>
`,
                {
                    items: items.map((item) => ({
                        path: `/${item.logIndex}`,
                        title: item.header.title,
                    })),
                },
            ).trim(),
        );
    }

    printResult("ok");
};

main();
