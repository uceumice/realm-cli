import { ConfigFile, Config } from '../../../types';
import { validateConfig } from '../../../helpers/validation';
import { FileManager } from '../__manager';
import _ from 'lodash';

const EmptyFile: ConfigFile = [];

export class ConfigFileManager extends FileManager<ConfigFile> {
  constructor(outRel: string) {
    super(outRel, 'config.json');
  }
  public static create_file(outRel: string) {
    this.__init<ConfigFile>(outRel, 'config.json', EmptyFile);
  }
}
