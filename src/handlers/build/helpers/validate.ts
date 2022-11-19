import _ from 'lodash';
import type { ValidateFunction } from 'ajv';

export function validate<T = unknown>(ajv: ValidateFunction<T>) {
  const validator = ajv;

  return (data: any, message?: (err: string) => string): T => {
    if (!validator(data)) {
      const err = JSON.stringify(validator.errors || 'no info', undefined, 4);
      throw new Error(_.isUndefined(message) ? err : message(err));
    }
    return data as T;
  };
}
