/* tslint:disable:no-eval */
// [...]
import { ObjectExpression } from '@babel/types';
import generate from '@babel/generator';
import path from 'path';
import _ from 'lodash';

import { Configuration } from "@realm.w/helpers/out/types/create";
// [...]
import { validateNoFunConfig, validateRealmRunCrfConfig } from '../../helpers/validation';
import { pathWithPosixSep } from '../../helpers/files';
import { validate } from '../../helpers/validate';

// [...]
import type { FunctionConfig, Config } from '../../types';

function parsePath(srcRel: string, tsAbs: string) {
  // [1] find relative path of source .ts file
  let functionPath = path.relative(path.resolve(process.cwd(), srcRel), tsAbs);

  // [2] remove extension name (.ts)
  functionPath = pathWithPosixSep(functionPath.slice(0, -3));

  // [3] replace unallowed characters with dashes [SET: ASCII + 0-9 + _ + /]
  // TODO first character cannot be dash thou :)
  return functionPath.replace(/[^a-zA-Z0-9\_\/]+/g, '_');
}

function parseExpObj(objexp: ObjectExpression | undefined): unknown {
  return !_.isUndefined(objexp) ? eval(`(()=>(${generate(objexp).code}))()`) : {};
}

function noFunToConfig(path0: string, conf: FunctionConfig): Config {
  return {
    name: path0,
    ...(conf.exec?.priv === true && { private: true }),
    ...(conf.exec?.logs === false ? { disable_arg_logs: true } : { disable_arg_logs: false }),
    ...(conf.auth === 'sys' && { run_as_system: true }),
    ...(conf.auth !== 'sys' && !_.isFunction(conf.auth) && { run_as_user_id: conf.auth }),
    ...(!_.isUndefined(conf.exec?.cond) && { can_evaluate: conf.exec?.cond }),
    // ...(input.configs.auth !== "sys" && isFunction(input.configs.auth) && { run_as_user_id_script_source: input.configs.auth }) // TODO
  };
}

function realmFunCrfToConfig(path0: string, conf: Configuration): Config {
  return {
    name: path0,
    ...(conf.execution?.private === true && { private: true }),
    ...(conf.arguments?.log === false ? { disable_arg_logs: true } : { disable_arg_logs: false }),
    ...(conf.execution?.authorization === 'system' && { run_as_system: true }),
    ...(conf.execution?.authorization !== 'system' &&
      !_.isUndefined(conf.execution?.authorization) && { run_as_user_id: conf.execution?.authorization! }),
    ...(!_.isUndefined(conf.execution?.condition) && { can_evaluate: conf.execution?.condition! }),
  };
}

export function generateNoFunFileConfig(
  srcRel: string,
  tsAbs: string,
  configAst: ObjectExpression | undefined,
): Config {
  const path0 = parsePath(srcRel, tsAbs);

  // [1] generate javascript object from ast node
  const parsed = parseExpObj(configAst);

  // [2] validate generated javascript object / does it correspond to 'no fun' object type ?
  const validated = validate(validateNoFunConfig)(parsed, (err) => `invalid 'config' object`);

  // [3] return the transformed conf object (for config.json entry)
  return noFunToConfig(path0, validated);
}

export function generateRealmFunCrfFileConfig(
  srcRel: string,
  tsAbs: string,
  configAst: ObjectExpression | undefined,
): Config {
  const path0 = parsePath(srcRel, tsAbs);

  // [1] generate javascript object from ast node
  const parsed = parseExpObj(configAst);

  // [2] validate generated javascript object / does it correspond to 'no fun' object type ?
  const validated = validate(validateRealmRunCrfConfig)(parsed, (err) => `invalid 'configuration' argument`);

  // [3] return the transformed conf object (for config.json entry)
  return realmFunCrfToConfig(path0, validated);
}
