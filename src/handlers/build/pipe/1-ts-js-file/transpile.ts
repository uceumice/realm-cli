import typescript from 'typescript';

// (dynamic) [tsconfig.json]
import _ from 'lodash';
import { config } from './tsconfig';
import { pathWithNativeSep } from '../../helpers/files';

export const transpile = (tsAbss: string[]) => {
  // [1] create typescript API program
  const compiler = typescript.createProgram([...tsAbss], config());

  // [2] compile typescript files and
  // emit to the temporary build directory
  const funcs: { [K in string]: string } = {};
  const files: { [K in string]: string } = {};
  compiler.emit(undefined, (f, code, w, e, sourceFiles, d) => {
    // [1] get source typescript with transpiled javascript code
    let sourceFunctionFilename = sourceFiles?.map((a) => a.getSourceFile().fileName)[0];
    sourceFunctionFilename = sourceFunctionFilename && pathWithNativeSep(sourceFunctionFilename);

    if (!_.isUndefined(sourceFunctionFilename)) {
      if (tsAbss.some((file) => file === sourceFunctionFilename)) {
        funcs[sourceFunctionFilename] = code;
      } else {
        files[sourceFunctionFilename] = code;
      }
    }
  });

  // [3] collect/deduct absolute paths to the compiled .js files
  return { funcs, files };
};
