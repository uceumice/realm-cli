#!/usr/bin/env node

import { Command } from 'commander';
import readline from 'readline';

import { BuildHandler } from './handlers/build';
import chalk from 'chalk';

const program = new Command(`realm-fun`);

// [...]
program
    .action(async () => {
        console.log(
            chalk.rgb(0, 190, 80).bold.bgRgb(32, 35, 36)(
                "     ___          ___          ___                       ___                                        ___       ___          ___\r\n    \/\\  \\        \/\\__\\        \/\\  \\                     \/\\  \\                                      \/\\__\\     \/\\  \\        \/\\  \\\r\n   \/::\\  \\      \/:\/ _\/_      \/::\\  \\                   |::\\  \\               ======               \/:\/ _\/_    \\:\\  \\       \\:\\  \\\r\n  \/:\/\\:\\__\\    \/:\/ \/\\__\\    \/:\/\\:\\  \\                  |:|:\\  \\           ====    =====          \/:\/ \/\\__\\    \\:\\  \\       \\:\\  \\\r\n \/:\/ \/:\/  \/   \/:\/ \/:\/ _\/_  \/:\/ \/::\\  \\  ___     ___  __|:|\\:\\  \\       ====   ===     ==        \/:\/ \/:\/  \/___  \\:\\  \\  _____\\:\\  \\\r\n\/:\/_\/:\/__\/___\/:\/_\/:\/ \/\\__\\\/:\/_\/:\/\\:\\__\\\/\\  \\   \/\\__\\\/::::|_\\:\\__\\     ==                =      \/:\/_\/:\/  \/\/\\  \\  \\:\\__\\\/::::::::\\__\\\r\n\\:\\\/:::::\/  \/\\:\\\/:\/ \/:\/  \/\\:\\\/:\/  \\\/__\/\\:\\  \\ \/:\/  \/\\:\\~~\\  \\\/__\/   ====    ======     ======  \\:\\\/:\/  \/ \\:\\  \\ \/:\/  \/\\:\\~~\\~~\\\/__\/\r\n \\::\/~~\/~~~~  \\::\/_\/:\/  \/  \\::\/__\/      \\:\\  \/:\/  \/  \\:\\  \\       ===                       ==  \\::\/__\/   \\:\\  \/:\/  \/  \\:\\  \\\r\n  \\:\\~~\\       \\:\\\/:\/  \/    \\:\\  \\       \\:\\\/:\/  \/    \\:\\  \\      ==   =======       =====   =   \\:\\  \\    \\:\\\/:\/  \/    \\:\\  \\\r\n   \\:\\__\\       \\::\/  \/      \\:\\__\\       \\::\/  \/      \\:\\__\\      ===                      ==    \\:\\__\\    \\::\/  \/      \\:\\__\\\r\n    \\\/__\/        \\\/__\/        \\\/__\/        \\\/__\/        \\\/__\/        ========================      \\\/__\/     \\\/__\/        \\\/__\/"
            )
        );
    })

// [functions]
const functions = program
    .command(`functions`);

// functions > build
functions
    .command(`build`)
    .description(`build TypeScript functions to JavaScript`)
    .argument(`<source>`, `source directory`)
    .argument(`<destination>`, `destination directory`)
    .option(`-w, --watch`, `watch for changes in source directory`, false)
    .option(`-f, --flatten`, `ignore directory hierarchy and output functions in destination directory as files only`, false)
    .action(async (source, destination, { watch, flatten }) => {
        const buildHandler = new BuildHandler(source, destination);
        await buildHandler.build({ flatten });

        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);

        if (watch === true) {
            buildHandler.watch(() => {
                console.log(chalk.hex(`#675ce0`)(`[C] Exit`));
            }, flatten);

            process.stdin.on('keypress', (str, key) => {
                if (key.name === 'c' || (key.crtl && key.name === 'c')) {
                    buildHandler.clear();
                    process.exit(0);
                }
            });
        } else {
            buildHandler.clear();
            process.exit(0);
        }
    })

program.parse(process.argv)
