#!/usr/bin/env -S deno --allow-read --allow-write=log --allow-write=out

import djot from "npm:@djot/djot";
import { format, parse } from "npm:date-fns";
import mustache from "npm:mustache";
import * as yaml from "jsr:@std/yaml";
import hljs from "npm:highlight.js";

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
const Templates = {
    index: "src/templates/index.html",
    log: {
        layout: "src/templates/log/layout.html",
        index: "src/templates/log/index.html",
        entry: "src/templates/log/entry_page.html",
    },
};

type Command = "help" | "version" | "log" | "build";
type SubCommand = string;

const LogTemplates = {
    NewLog: `---
title: {{title}}
createdAt: {{date}}
revision: 1
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
            const isDev = Deno.args.includes("--dev");
            executeBuildCommand({
                mode: isDev ? "dev" : "prod",
            });
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
                const title = prompt("Title:");
                const slug = (prompt("Slug:") || title)?.replaceAll(" ", "-")
                    ?.toLowerCase() ?? "";
                const fileName = `${newIndex}-${slug}.dj`;
                const file = `${Dirs.logs}/${fileName}`;

                const content = mustache.render(
                    LogTemplates.NewLog,
                    {
                        title,
                        date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                    },
                );
                Deno.writeTextFileSync(
                    file,
                    content,
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
        const renderedContent = djot.renderHTML(parsedContent, {
            overrides: {
                code_block: (node, renderer) => {
                    let language = node.lang || "";

                    switch (language) {
                        case "ts":
                        case "typescript":
                            language = "typescript";
                            break;
                        default:
                            break;
                    }

                    const value = hljs.highlight(
                        node.text.trim(),
                        { language: language },
                    ).value;

                    return `<div class="code-block">
<pre><code class="hljs" data-language="${language}">${value}</code></pre>
<span class="lang-tag">${language}</span>
</div>`;
                },
            },
        });

        const logNameProps = sourceFileName.substring(
            0,
            sourceFileName.lastIndexOf("."),
        ).split("-");
        const logIndex = logNameProps[0];
        // Timezone: UTC+1
        const logDate = parse(
            header.createdAt,
            "yyyy-MM-dd'T'HH:mm",
            new Date(0),
        );

        items.push({
            logIndex,
            logDate,
            formattedDate: format(logDate, "E, dd MMM yyyy HH:mm"),
            sourceFileName,
            header,
            contentDjot: parsedContent,
            contentHtml: renderedContent,
        });
    }
    items.sort((a, b) => b.logDate.getTime() - a.logDate.getTime());
    return items;
};

const executeBuildCommand = (opts: { mode: "dev" | "prod" }) => {
    const items = collectLogItems();
    console.log(`Found: ${items.length} items`);

    const buildUid = Math.floor(new Date().getTime() / 1000);
    const pageGlobal = {
        title: "/dector/log",
        buildUid,
    };

    try {
        Deno.removeSync(Dirs.out.root, { recursive: true });
    } catch {
    } finally {
        Deno.mkdirSync(Dirs.out.root);
        Deno.mkdirSync(Dirs.out.log);
    }

    for (const item of items) {
        //const contentDjot = item.contentDjot;
        const contentHtml = item.contentHtml;

        const itemDir = `${Dirs.out.log}/${item.logIndex}`;
        Deno.mkdirSync(itemDir);

        const entryHtml = mustache.render(
            Deno.readTextFileSync(Templates.log.entry),
            {
                content: contentHtml,
                title: item.header.title,
                date: item.formattedDate,
                tags: item.header.tags,
            },
        ).trim();
        const pageHtml = mustache.render(
            Deno.readTextFileSync(Templates.log.layout),
            {
                page: {
                    ...pageGlobal,
                    title: `${pageGlobal.title} ~ ${item.header.title}`,
                    content: entryHtml,
                },
            },
        ).trim();

        const file = `${itemDir}/index.html`;
        Deno.writeTextFileSync(file, pageHtml);
    }

    {
        const entryHtml = mustache.render(
            Deno.readTextFileSync(Templates.log.index),
            {
                items: items.map((item) => ({
                    title: item.header.title,
                    path: `/log/${item.logIndex}`,
                })),
            },
        ).trim();
        const pageHtml = mustache.render(
            Deno.readTextFileSync(Templates.log.layout),
            {
                page: {
                    ...pageGlobal,
                    content: entryHtml,
                },
            },
        ).trim();
        Deno.writeTextFileSync(
            `${Dirs.out.log}/index.html`,
            pageHtml,
        );
    }

    {
        const html = mustache.render(
            Deno.readTextFileSync(Templates.index),
            {
                page: {
                    ...pageGlobal,
                },
            },
        ).trim();
        Deno.writeTextFileSync(
            `${Dirs.out.root}/index.html`,
            html,
        );
    }

    printResult("ok");
};

main();
