import _ from 'lodash';
import ts from 'typescript';

// dynamically created typescript configuration object
export const config = (overrides?: ts.CompilerOptions): ts.CompilerOptions =>
  _.defaultsDeep(
    {},
    // [cannot be overriden]
    {
      target: ts.ScriptTarget.ES2018,
      module: ts.ModuleKind.CommonJS,
      strict: true,
      noEmitHelpers: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      importHelpers: true,
      skipLibCheck: true,
      outDir: 'realm_fun_build_dir',
    } as ts.CompilerOptions,
    // [overrides]
    overrides,
    // [can be overriden]
    {
      types: ['node', 'tslib'],
    } as ts.CompilerOptions,
  );
