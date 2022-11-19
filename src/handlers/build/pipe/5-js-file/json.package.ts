import * as fs from 'fs';
import _ from 'lodash';
import path from 'path';

export const writeToPackageFile = (outRel: string, dependencies: string[]) => {
  // [~] for summary
  const allFileDependencies: { [K in string]: string } = {};

  // [1] retrieve the full function's package.json
  const packageFileAbs = path.join(path.resolve(process.cwd(), outRel), 'package.json');
  const packageFile = JSON.parse(fs.readFileSync(packageFileAbs, { encoding: 'utf8' })) as {
    dependencies?: { [K in string]: string };
  };
  const packageDependencies = _.defaultsDeep({}, packageFile.dependencies);

  // [2] retrieve global 'package.json' file
  const globalPackageFileAbs = path.resolve(process.cwd(), `package.json`);
  const globalPackageFile = JSON.parse(fs.readFileSync(globalPackageFileAbs, { encoding: 'utf8' })) as {
    dependencies?: { [K in string]: string };
    devDependencies?: { [K in string]: string };
  };
  const globalPackageDependencies = _.defaultsDeep(
    {},
    globalPackageFile.dependencies,
    globalPackageFile.devDependencies,
  );

  // [3] dependency versioning logic
  dependencies.forEach((name) => {
    const inPackage = !_.isUndefined(packageDependencies[name]);
    const inGlobalPackage = !_.isUndefined(globalPackageDependencies[name]);

    // [3.1] determine the version alias/number of the dependency
    let version: string;

    if (inGlobalPackage) version = globalPackageDependencies[name];
    else version = 'latest';

    // [3.~] record dependencies (all) > for summary
    _.defaultsDeep(allFileDependencies, { [name]: version });

    // [3.2] check if the dependency was already added to the 'package.json'
    if (!inPackage) {
      // [3.3] add dependency entry to the package.json
      _.defaultsDeep(packageDependencies, { [name]: version });
    }
  });

  // [5] overwrite the 'package.json' file with new information
  fs.writeFileSync(packageFileAbs, JSON.stringify({ dependencies: packageDependencies }, undefined, 4), { encoding: 'utf8' });

  return allFileDependencies;
};
