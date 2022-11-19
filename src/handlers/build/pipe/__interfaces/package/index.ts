import { PackageFile, Config } from '../../../types';
import { FileManager } from '../__manager';
import _ from 'lodash';

const EmptyFile: PackageFile = { dependencies: {} };

export class PackageFileManager extends FileManager<PackageFile> {
  constructor(outRel: string) {
    super(outRel, 'package.json');
  }
  public static create_file(outRel: string) {
    this.__init<PackageFile>(outRel, 'package.json', EmptyFile);
  }
}
