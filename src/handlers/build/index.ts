import { files as files } from './helpers/files';
import { transpile } from './pipe/1-ts-js-file/transpile';
import * as fs from 'fs';
import chalk from 'chalk';
import path from 'path';

import _ from 'lodash';
import { ConfigFileManager } from './pipe/__interfaces/config';
import { PackageFileManager } from './pipe/__interfaces/package';
import { generateNoFunFileConfig, generateRealmFunCrfFileConfig } from './pipe/3-info-js/config';
import { writeToConfigFile } from './pipe/5-js-file/json.config';
import { writeToPackageFile } from './pipe/5-js-file/json.package';
import { getObjectSize } from './helpers/objectsize';
import { parseFunctionFile } from './pipe/2-file-js-ast-info/parse';

import watch from 'node-watch';
import { function_file_fun, function_file_raw } from './pipe/3-info-js/file';
import { writeToFunctionJsFile as writeToFunctionJsFile } from './pipe/5-js-file/js.file.js';
import { Config } from './types';
import moment from 'moment';
import { isObjectExpression } from '@babel/types';
import { minify_file_code } from './pipe/4-js-js/minify';

export class BuildHandler {
  private srcRel: string;
  private outRel: string;

  private watcher: fs.FSWatcher | undefined;

  constructor(src: string, out: string) {
    this.srcRel = src;
    this.outRel = out;

    this.__init();
  }

  private __init() {
    // [1] empty the out directory
    fs.rmSync(this.outRel, { recursive: true, force: true });
    fs.mkdirSync(this.outRel, { recursive: true });

    // [2] create 'config.json' & 'package.json' files
    ConfigFileManager.create_file(this.outRel);
    PackageFileManager.create_file(this.outRel);
  }

  public clear() {
    if (_.isUndefined(this.watcher)) return;
    this.watcher?.close();
  }

  public async build(options?: { flatten?: boolean }) {
    // [0] collect all .ts files from 'src' dir
    const tsfs = files(this.srcRel);

    // [0.1] case when there are no functions
    if (tsfs.length === 0) {
      console.log(chalk.bgRed(`directory: '${this.srcRel}' has no functions defined `));
    }

    // [1] transpile .ts files to .js
    const jsfs = transpile(tsfs);

    // [2] build each .ts file to a realm function dir ('out')
    console.log(`\n` + chalk.white.bgGrey('⋆ ˚｡⋆୨˚｡ ✧･ ⋆୨୧˚ FUNCTIONS ⋆ ˚｡⋆୨˚｡୧˚⋆୨୧˚ ✧･ﾟ') + `\n`);

    const summary: {
      count: number;
      tsize: number;
      tdeps: { [K in string]: string };
    } = {
      count: 0,
      tsize: 0,
      tdeps: {},
    };

    for (const ts of tsfs) {
      const build = await this.__build_one(ts, jsfs.funcs, jsfs.files, { flatten: options?.flatten });

      summary.count++;
      summary.tsize += parseInt(build?.size.value ?? '0', 10);
      summary.tdeps = _.defaultsDeep({}, summary.tdeps, build?.deps ?? {});
    }

    // [3] ✨✨✨ SUMMARY ✨✨✨
    console.log(
      [
        chalk.white.bgGrey('⋆ ˚｡⋆୨˚｡ ✧･ﾟ ⋆୨୧˚ SUMMARY ⋆ ˚｡⋆ ୨˚｡୧˚⋆୨୧˚ ✧･ﾟ'),
        '\n',
        chalk.bgBlack.white(`FUNCTIONS: ${summary.count}`),
        ' | ',
        chalk.bgBlack.red(`SIZE: ${(summary.tsize / 1024).toFixed(2)} KB`),
        ' | ',
        !_.isEmpty(summary.tdeps) && chalk.bgBlack.rgb(0, 190, 80)(`DEPENDENCIES: ${_.size(summary.tdeps)}`),
        ...(!_.isEmpty(summary.tdeps)
          ? _.entries(summary.tdeps).map(([name, version], ind, arr) => {
            const refColorValue: number = Math.round((ind / arr.length) * 255);

            return chalk.rgb(154, 255 - refColorValue, refColorValue)(`\n    > ${name}:${version}`);
          })
          : []),
        '\n',
      ].join(''),
    );
  }

  public watch(onClear?: () => void, options?: { flatten?: boolean }) {
    console.clear();
    console.log(chalk.hex(`#9ae7fc`)(`[${moment(moment.now()).format('HH:mm:ss')}] [Initial Build]`));
    if (onClear) onClear();

    this.watcher = watch(
      this.srcRel,
      {
        recursive: true,
        encoding: 'utf8',
        filter: /\.ts$/,
      },
      async (evt, name) => {
        // TODO #1 'function build ... ... -w' track files deletes

        if (evt === 'update') {
          console.clear();
          console.log(chalk.hex(`#39889e`)(`[${moment(moment.now()).format('HH:mm:ss')}] [Building] > ...`));
          if (onClear) onClear();

          const ts = [path.resolve(process.cwd(), name)];
          const js = transpile(ts);

          await this.__build_one(ts[0], js.funcs, js.files, { overwrite: true, flatten: options?.flatten });

          console.clear();
          console.log(chalk.hex(`#9ae7fc`)(`[${moment(moment.now()).format('HH:mm:ss')}] [Build] > ${name}`));
          if (onClear) onClear();
        }
      },
    );
  }

  private async __build_one(
    tsAbs: string,
    libFuncs: { [K in string]: string },
    libFiles: { [K in string]: string },
    options?: { overwrite?: boolean, flatten?: boolean },
  ) {
    // [1] analyze code by [code] and [exports/variables]
    const asts = parseFunctionFile(tsAbs, libFuncs[tsAbs], libFuncs, libFiles);

    // [2] on basis of previous analyzis, produce
    // the 'source code' and 'configuration' object
    let generatedCode: string;
    let generatedConfig: Config;
    let generatedPackDeps: string[];

    // 'raw' template
    if (!_.isEmpty(asts.exports.raw.func)) {
      const temp0 = function_file_raw(asts, libFuncs, libFiles);
      generatedCode = temp0.code;
      generatedPackDeps = temp0.packsDeps;
      generatedConfig = generateNoFunFileConfig(
        this.srcRel,
        tsAbs,
        (() => {
          if (asts.exports.raw.config.length > 0) {
            return asts.exports.raw.config[0].expression;
          }
        })(),
      );
    }
    // 'fun' template
    else if (!_.isEmpty(asts.exports.fun.func)) {
      const temp0 = function_file_fun(asts, libFuncs, libFiles);
      generatedCode = temp0.code;
      generatedPackDeps = temp0.packsDeps;
      generatedConfig = generateRealmFunCrfFileConfig(
        this.srcRel,
        tsAbs,
        (() => {
          if (
            asts.exports.fun.func.length > 0 &&
            isObjectExpression(asts.exports.fun.func[0].expression.arguments[0])
          ) {
            return asts.exports.fun.func[0].expression.arguments[0];
          }
        })(),
      );
    }
    // invalid template
    else {
      console.log(
        [
          chalk.hex('#9ae7fc')(`\nfunction: '${tsAbs}'`),
          chalk.red(`\n> file must either default export a 'crf' call or an arrow function () => {...}`),
        ].join(''),
      );
      return;
    }

    // [2.~] minify produced code
    const minifiedCode = minify_file_code(generatedCode);

    // [3] write 'source code' to function file,
    // write imports to 'package.json' & config object to 'config.json'
    // flatten
    const fnname = options?.flatten === true ? generatedConfig.name.split(`/`).join(`_`) : generatedConfig.name;
    writeToFunctionJsFile(this.outRel, fnname, minifiedCode);
    writeToConfigFile(this.outRel, { ...generatedConfig, name: fnname }, options?.overwrite || false);
    const writtenPackageFile = writeToPackageFile(
      this.outRel,
      asts.requires.packages.map((p) => p.package).concat(generatedPackDeps),
    );

    // [4] ✨✨✨ SUMMARY ✨✨✨
    const functionName = fnname;
    const functionSize = getObjectSize(generatedCode);
    const functionDeps = _.entries(writtenPackageFile).map(([name, version]) => `${name}:${version}`);

    // LINE 1       | function name | size (path)
    console.log(
      [
        chalk.bgBlack.white(`'${functionName}'`),
        chalk.bgBlack.white(`|`),
        chalk.bgBlack.grey(`${functionSize}`),
        chalk.bgBlack.white(`|`),
        chalk.bgBlack.hex(`#9ae7fc`)(`${fnname + `.js`}`),
      ].join(' '),
    );
    // LINE 2       | > function dependencies
    if (!_.isEmpty(functionDeps.length)) {
      console.log(
        [
          chalk.bgBlack.white(new Array(4).join(' ')),
          chalk.bgBlack.red(`>`),
          chalk.bgBlack.blueBright(functionDeps.join()),
        ].join(' '),
      );
    }
    // LINE 3       | *space*
    console.log(`\n`);

    return {
      name: functionName,
      path: generatedConfig.name,
      size: functionSize,
      deps: writtenPackageFile,
    };
  }
}
