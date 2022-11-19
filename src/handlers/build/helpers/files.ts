import glob from 'glob';
import path from 'path';
import * as fs from 'fs';

export function pathWithNativeSep(path0: string) {
  return path0.split(path.posix.sep).join(path.sep);
}

export function pathWithPosixSep(path0: string) {
  return path0.split(path.sep).join(path.posix.sep);
}

export function files(srcRel: string, pattern: string = `**/!(*.d).ts`): string[] {
  // [1] find relative paths to the typescript files
  const filesAbss = glob
    .sync(`${srcRel}/${pattern}`)
    .map((pth) => path.resolve(process.cwd(), pth))
    .filter((pth) => fs.lstatSync(pth).isFile());

  return filesAbss;
}
