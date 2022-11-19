import {
  isAssignmentExpression,
  isCallExpression,
  isExpressionStatement,
  isIdentifier,
  isMemberExpression,
  isStringLiteral,
  isVariableDeclaration,
  Node,
} from '@babel/types';

/**
 * ?? Seeker Methods
 *
 * analyze node that match the condition
 * and return the relevant information
 */

/**
 *
 * @param node @babel/types AST Node set for evaluation
 * @returns the 'id' of variable declarator and the argument of the 'require' function / the required module
 */
export function seekRequireModuleDeclaration(node: Node) {
  // [1] `const $module--name = ...`
  if (isVariableDeclaration(node) && node.kind === 'const' && isIdentifier(node.declarations[0].id)) {
    const id = node.declarations[0].id;

    // [2.1] `const $identifier--name = ...(...)`
    if (isCallExpression(node.declarations[0].init)) {
      const init = node.declarations[0].init;

      // [3.1] `const $identifier--name = require(%string--literal)`
      if (
        isIdentifier(node.declarations[0].init.callee) &&
        node.declarations[0].init.callee.name === `require` &&
        isStringLiteral(node.declarations[0].init.arguments[0])
      ) {
        return {
          id,
          node,
          require: node.declarations[0].init.arguments[0].value,
        };
      }

      // ?? 'tslib' helper functions
      // [3.2] `const $identifier--name = ...(require(%string--literal))`
      else if (
        isCallExpression(init.arguments[0]) &&
        isIdentifier(init.arguments[0].callee) &&
        init.arguments[0].callee.name === `require` &&
        isStringLiteral(init.arguments[0].arguments[0])
      ) {
        return {
          id,
          node,
          require: init.arguments[0].arguments[0].value,
        };
      }
    }
  }
}

/**
 *
 * @param node @babel/types AST Node set for evaluation
 * @returns  the 'id' of exports specifier and the expression that's being exported
 */
export function seekModulesExportsExpression(node: Node) {
  // [1] `exports.%identifier = ...`
  if (
    isExpressionStatement(node) &&
    isAssignmentExpression(node.expression) &&
    node.expression.operator === `=` &&
    isMemberExpression(node.expression.left) &&
    isIdentifier(node.expression.left.object) &&
    node.expression.left.object.name === `exports` &&
    isIdentifier(node.expression.left.property)
  ) {
    const id = node.expression.left.property;

    return {
      id,
      expression: node.expression.right,
    };
  }
}
