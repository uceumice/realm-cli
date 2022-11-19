import * as fs from 'fs';
import path = require('path');

import { validateConfig } from '../../helpers/validation';

import type { Config } from '../../types';

export const writeToConfigFile = (outRel: string, config: Config, overwrite?: boolean) => {
  // [1] validate the 'config' object against ajv schema
  const validate = validateConfig;
  if (!validate(config))
    throw new Error(
      `configuration object for function '${JSON.stringify(config)}' is invalid: ${JSON.stringify(
        validate.errors || 'no info',
        undefined,
        4,
      )}`,
    );

  // [2] retrieve the full configuration array
  const configFileAbs = path.join(path.resolve(process.cwd(), outRel), 'config.json');
  let configFile = JSON.parse(fs.readFileSync(configFileAbs, { encoding: 'utf8' })) as Config[];

  // [3] check for conflicts in function names
  if (configFile.some((someConfig) => someConfig.name === config.name)) {
    if (!overwrite) throw new Error(`function with name '${config.name}' already exists`);

    configFile = configFile.filter((someConfig) => someConfig.name !== config.name);
  }

  // [4] push safe config object to the rest of configuration
  configFile.push(config);

  // [5] overwrite the 'config.json' file with new information
  fs.writeFileSync(configFileAbs, JSON.stringify(configFile, undefined, 4), { encoding: 'utf8' });
};
