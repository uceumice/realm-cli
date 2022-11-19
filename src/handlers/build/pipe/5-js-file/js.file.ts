import * as fs from 'fs';
import path from 'path';

import { pathWithNativeSep } from '../../helpers/files';

export const writeToFunctionJsFile = (outRel: string, name: string, code: string) => {
  // [1] find relative path tp function file's directory
  const functionDirRel = path.join(outRel, path.join(pathWithNativeSep(name), `../`));

  // [2] find/construct respective relative path to function file
  const functionFileRel = path.resolve(functionDirRel, name.split(path.posix.sep).pop() + `.js`);

  // [2.1] find/construct respective absolute path to function file
  const functionFileAbs = path.resolve(process.cwd(), functionFileRel);

  // [3] create function file's directory if not present
  if (!fs.existsSync(functionDirRel)) fs.mkdirSync(path.resolve(process.cwd(), functionDirRel), { recursive: true });

  // [4] write function file to the respective directory
  fs.writeFileSync(functionFileAbs, code, { encoding: 'utf8', flag: 'w' });

  return functionFileAbs;
};
