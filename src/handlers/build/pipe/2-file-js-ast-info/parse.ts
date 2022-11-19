import traverse from '@babel/traverse';
import { parse } from '@babel/parser';

import PathNodeModule from 'path';
import _ from 'lodash';

import {
  ArrowFunctionExpression,
  CallExpression,
  Declaration,
  Identifier,
  isArrowFunctionExpression,
  isCallExpression,
  isDeclaration,
  isIdentifier,
  isMemberExpression,
  isObjectExpression,
  isSequenceExpression,
  ObjectExpression,
  Statement,
  VariableDeclaration,
} from '@babel/types';

import { seekModulesExportsExpression, seekRequireModuleDeclaration } from './seek';

export function parseFunctionFile(
  abs: string,
  code: string,
  funcs: { [K in string]: string },
  files: { [K in string]: string },
) {
  // parse .js file to Babel AST
  const ast = parse(code);

  // required node packages
  const sRPDs = [] as {
    id: Identifier;
    node: VariableDeclaration;
    require: string;
    package: string;
  }[];

  // required file modules
  const sRMDs = [] as {
    id: Identifier;
    node: VariableDeclaration;
    require: string;
  }[];

  // exported config object
  const sECOs = [] as {
    id: Identifier;
    expression: ObjectExpression;
  }[];

  // exported (default) main function
  const sEMFs = [] as {
    expression: ArrowFunctionExpression;
  }[];

  // exported framework function call
  const sEFCs = [] as {
    id: Identifier;
    expression: CallExpression;
  }[];

  // various declarations
  const sVFDs = [] as {
    node: Declaration;
  }[];

  traverse(ast, {
    Program(path) {
      path.node.body.forEach((node) => {
        // !! REQUIRE | sRPDs & sRMDs
        const sRMD = seekRequireModuleDeclaration(node);
        if (!_.isUndefined(sRMD)) {
          const PathAbs = PathNodeModule.join(abs, `../${sRMD.require}.ts`);

          // check if module is an import from 'functions' file
          if (_.keys(funcs).includes(PathAbs)) {
            throw new Error(`imports cannot originate from other 'functions' file`);
          }
          // check if module is an import from 'regular/related' file
          else if (_.keys(files).includes(PathAbs)) {
            sRMDs.push({
              ...sRMD,
              require: PathAbs,
            });
          }
          // otherwise module must be imported from a node package
          else {
            sRPDs.push({
              ...sRMD,
              package: sRMD.require.split('/').slice(0, 2).join('/'),
            });
          }
          return;
        }

        // !! EXPORTS | sECO & sEMF & sEFC
        const sMEE = seekModulesExportsExpression(node);
        if (!_.isUndefined(sMEE)) {
          // check for 'config' object
          if (sMEE.id.name === `config` && isObjectExpression(sMEE.expression)) {
            // @ts-ignore
            sECOs.push(sMEE);
          }
          // check for default
          else if (sMEE.id.name === `default`) {
            // main function export
            if (isArrowFunctionExpression(sMEE.expression)) {
              // @ts-ignore
              sEMFs.push(sMEE);
            }
            // call to Realm Fun framework export
            else if (
              isCallExpression(sMEE.expression) &&
              isSequenceExpression(sMEE.expression.callee) &&
              isMemberExpression(sMEE.expression.callee.expressions[1]) &&
              isIdentifier(sMEE.expression.callee.expressions[1].property) &&
              sMEE.expression.callee.expressions[1].property.name === 'crf'
            ) {
              // @ts-ignore
              sEFCs.push(sMEE);
            }
            // invalid export expression
            else {
              throw new Error(
                `the exported (default) expression does not match the criteria of a RealmFun function: neither an arrow function nor a framework function call`,
              );
            }
          }
          return;
        }

        // !! DECLARATIONS
        if (isDeclaration(node)) {
          sVFDs.push({
            node
          });
        }
      });
    },
  });

  return {
    requires: {
      packages: sRPDs,
      files: sRMDs,
    },
    declarations: sVFDs,
    exports: {
      raw: {
        config: sECOs,
        func: sEMFs,
      },
      fun: {
        func: sEFCs,
      },
    },
  };
}
export type ParseFunctionFileResult = ReturnType<typeof parseFunctionFile>;

export function parseFile(
  abs: string,
  code: string,
  funcs: { [K in string]: string },
  files: { [K in string]: string },
) {
  // parse .js file to Babel AST
  const ast = parse(code);

  // required node packages
  const sRPDs = [] as {
    id: Identifier;
    node: VariableDeclaration;
    require: string;
    package: string;
  }[];

  // required file modules
  const sRMDs = [] as {
    id: Identifier;
    node: VariableDeclaration;
    require: string;
  }[];

  // all file contents
  const sAFCs = [] as {
    node: Statement;
  }[];

  traverse(ast, {
    Program(path) {
      path.node.body.forEach((node) => {
        // !! REQUIRE | sRPDs & sRMDs
        const sRMD = seekRequireModuleDeclaration(node);
        if (!_.isUndefined(sRMD)) {
          const PathAbs = PathNodeModule.join(abs, `../${sRMD.require}.ts`);

          // check if module is an import from 'functions' file
          if (_.keys(funcs).includes(PathAbs)) {
            throw new Error(`imports cannot originate from other 'functions' file`);
          }
          // check if module is an import from 'regular/related' file
          else if (_.keys(files).includes(PathAbs)) {
            sRMDs.push({
              ...sRMD,
              require: PathAbs,
            });
          }
          // otherwise module must be imported from a node package
          else {
            sRPDs.push({
              ...sRMD,
              package: sRMD.require.split('/').slice(0, 2).join('/'),
            });
          }
          return;
        }

        sAFCs.push({
          node
        });
      });
    },
  });

  return {
    requires: {
      packages: sRPDs,
      files: sRMDs,
    },
    content: sAFCs,
  };
}
export type ParseFileResult = ReturnType<typeof parseFile>;
