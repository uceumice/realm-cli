import Ajv, { JSONSchemaType } from 'ajv';

// [...]
import type { FunctionConfig, Config } from '../types';
import type { Configuration } from '@realm.w/helpers/out/types/create';

const ajv = new Ajv();

// schemas
const noFunConfigSchema: JSONSchemaType<FunctionConfig> = {
  type: 'object',
  properties: {
    exec: {
      type: 'object',
      properties: {
        logs: {
          type: 'boolean',
          default: true,
          nullable: true,
        },
        priv: {
          type: 'boolean',
          default: false,
          nullable: true,
        },
        cond: {
          type: 'object',
          nullable: true,
          additionalProperties: false,
        },
      },
      nullable: true,
      additionalProperties: false,
    },
    auth: {
      type: 'string',
      nullable: true,
    },
  },
  additionalProperties: false,
};

const realmFunConfigSchema: JSONSchemaType<Omit<Configuration, "arguments"> & { arguments?: Omit<Configuration["arguments"], "validate"> }> = {
  type: 'object',
  properties: {
    arguments: {
      type: 'object',
      nullable: true,
      properties: {
        log: {
          type: 'boolean',
          nullable: true,
        },
      },
      additionalProperties: true
    },
    execution: {
      type: 'object',
      nullable: true,
      properties: {
        authorization: {
          type: 'string',
          nullable: true,
        },
        condition: {
          type: 'object',
          nullable: true,
          required: [],
        },
        private: {
          type: 'boolean',
          nullable: true,
        },
        throw: {
          type: 'boolean',
          nullable: true,
        },
      },
    },
  },
  additionalProperties: false,
};

const configSchema: JSONSchemaType<Config> = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      pattern: '^[^_/][a-zA-Z0-9/_]*$',
    },
    can_evaluate: {
      type: 'object',
      nullable: true,
    },
    disable_arg_logs: {
      type: 'boolean',
      nullable: true,
      default: false,
    },
    private: {
      type: 'boolean',
      nullable: true,
      default: false,
    },
    run_as_system: {
      type: 'boolean',
      nullable: true,
    },
    run_as_user_id: {
      type: 'string',
      nullable: true,
    },
    run_as_user_id_script_source: {
      type: 'string',
      nullable: true,
    },
  },
  required: ['name'],
  additionalProperties: false,
};

// validators
export const validateNoFunConfig = ajv.compile(noFunConfigSchema);

export const validateRealmRunCrfConfig = ajv.compile(realmFunConfigSchema);

export const validateConfig = ajv.compile(configSchema);
