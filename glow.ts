#!/usr/bin/env -S deno --allow-read --allow-write=log

import djot from "npm:@djot/djot";
import { format } from "npm:date-fns";

const main = () => {
    const command = parseCommand(Deno.args);

    //console.debug(command);

    executeCommand(command);

    // console.log(djot.parse("hello _there_", { sourcePositions: true }));
};

const Dirs = {
    logs: "log",
};

type Command = "help" | "version" | "log";
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

                console.log();
                console.log("%cOK", "color: green");
                console.log(`%c${fileName}`, "color: orange");
            }
            break;
        default:
            Deno.exit(1);
            break;
    }
};

main();
