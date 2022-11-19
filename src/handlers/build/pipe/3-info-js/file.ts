import { parseFile, ParseFunctionFileResult } from '../2-file-js-ast-info/parse';

import generate from '@babel/generator';

import _ from 'lodash';

import {
  arrowFunctionExpression,
  assignmentExpression,
  awaitExpression,
  blockStatement,
  callExpression,
  emptyStatement,
  expressionStatement,
  Identifier,
  identifier,
  isAssignmentExpression,
  isCallExpression,
  isExpressionStatement,
  isIdentifier,
  isMemberExpression,
  isSequenceExpression,
  memberExpression,
  objectExpression,
  program,
  returnStatement,
  variableDeclaration,
  VariableDeclaration,
  variableDeclarator,
} from '@babel/types';

export function function_file_raw(
  input: ParseFunctionFileResult,
  funcs: { [K in string]: string },
  files: { [K in string]: string },
) {
  let packsDeps: string[] = [];

  const temp = program(
    [
      expressionStatement(
        assignmentExpression(
          `=`,
          identifier(`exports`),
          arrowFunctionExpression(
            input.exports.raw.func[0].expression.params,
            blockStatement([
              ...input.requires.packages.map((p) => p.node),
              ...input.requires.files.map((f) => {
                const pack0 = pack_file(f.id, f.require, files[f.require], funcs, files);
                packsDeps = packsDeps.concat(pack0.deps);
                return pack0.pack;
              }),
              ...input.declarations.map(d => d.node),
              returnStatement(
                awaitExpression(
                  callExpression(
                    input.exports.raw.func[0].expression,
                    input.exports.raw.func[0].expression.params.map((p) => {
                      if (!isIdentifier(p)) {
                        throw new Error(`parameter was found to be not an identifier`);
                      }
                      return p;
                    }),
                  ),
                ),
              ),
            ]),
            input.exports.raw.func[0].expression.async,
          ),
        ),
      ),
    ],
    [],
    `module`,
  );

  return { code: generate(temp).code, packsDeps };
}

export function function_file_fun(
  input: ParseFunctionFileResult,
  funcs: { [K in string]: string },
  files: { [K in string]: string },
) {
  const argsIdentifiers = (() => {
    if (
      isSequenceExpression(input.exports.fun.func[0].expression.callee) &&
      isMemberExpression(input.exports.fun.func[0].expression.callee.expressions[1]) &&
      isIdentifier(input.exports.fun.func[0].expression.callee.expressions[1].property)
    ) {
      switch (input.exports.fun.func[0].expression.callee.expressions[1].property.name) {
        case `crf`:
          return [identifier(`args`)];
        default:
          throw new Error(`the function call is not recognized as part of the 'realm fun' framework`);
      }
    }
    throw new Error(`the function call is not recognized as part of the 'realm fun' framework`);
  })();
  let packsDeps: string[] = [];

  const temp = program(
    [
      expressionStatement(
        assignmentExpression(
          `=`,
          identifier(`exports`),
          arrowFunctionExpression(
            argsIdentifiers,
            blockStatement([
              ...input.requires.packages.map((p) => p.node),
              ...input.requires.files.map((f) => {
                const pack0 = pack_file(f.id, f.require, files[f.require], funcs, files);
                packsDeps = packsDeps.concat(pack0.deps);
                return pack0.pack;
              }),
              ...input.declarations.map(d => d.node),
              returnStatement(awaitExpression(callExpression(input.exports.fun.func[0].expression, argsIdentifiers))),
            ]),
            true,
          ),
        ),
      ),
    ],
    [],
    `module`,
  );

  return { code: generate(temp).code, packsDeps };
}

// parse required files
function pack_file(
  id: Identifier,
  abs: string,
  code: string,
  funcs: { [K in string]: string },
  files: { [K in string]: string },
): { pack: VariableDeclaration; deps: string[] } {
  const fileInfo = parseFile(abs, code, funcs, files);

  let packDeps: string[] = fileInfo.requires.packages.map(p => p.package);

  const pack = variableDeclaration(`const`, [
    variableDeclarator(
      id,
      callExpression(
        arrowFunctionExpression(
          [],
          blockStatement([
            variableDeclaration(`const`, [variableDeclarator(identifier(`returns`), objectExpression([]))]),
            // requires node packages
            ...fileInfo.requires.packages.map((p) => p.node),
            // `cosnt $id(some file contents) = some file content`
            ...fileInfo.requires.files.map((f) => {
              const pack0 = pack_file(id, f.require, files[f.require], funcs, files);
              packDeps = packDeps.concat(pack0.deps);
              return pack0.pack;
            }),
            // some file content
            ...fileInfo.content.map((node) => {
              // exports.$identifier = ...
              if (
                isExpressionStatement(node.node) &&
                isAssignmentExpression(node.node.expression) &&
                node.node.expression.operator === `=` &&
                isMemberExpression(node.node.expression.left) &&
                isIdentifier(node.node.expression.left.object) &&
                node.node.expression.left.object.name === `exports` &&
                isIdentifier(node.node.expression.left.property)
              ) {
                return expressionStatement(
                  assignmentExpression(
                    `=`,
                    memberExpression(identifier(`returns`), node.node.expression.left.property),
                    node.node.expression.right,
                  ),
                );
              }

              // Object.$....
              if (
                isExpressionStatement(node.node) &&
                isCallExpression(node.node.expression) &&
                isMemberExpression(node.node.expression.callee) &&
                isIdentifier(node.node.expression.callee.object) &&
                node.node.expression.callee.object.name === `Object`
              ) {
                return emptyStatement();
              }
              return node.node;
            }),
            returnStatement(identifier(`returns`)),
          ]),
        ),
        [],
      ),
    ),
  ]);

  return {
    pack, deps: packDeps
  }
}
