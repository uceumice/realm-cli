import path from 'path';
import * as fs from 'fs';

export class FileManager<Content> {
  protected name: string;
  protected path0: string;
  protected directory: string;
  protected content: Content;

  constructor(outRel: string, filename: string, options?: { create?: Content }) {
    this.name = filename;
    this.directory = path.resolve(process.cwd(), outRel);
    this.path0 = path.join(this.directory, this.name);
    this.content = this.__find(this.path0, !!options?.create || false, options?.create);
  }

  protected static __init<T>(outRel: string, filename: string, init: T) {
    return new FileManager(outRel, filename, { create: init });
  }

  protected __find<C extends boolean>(
    path0: string,
    create: C,
    initial: C extends true ? Content : undefined,
  ): Content {
    if (!fs.existsSync(this.path0)) {
      if (!create) throw new Error(`'${path0}' does not exist`);

      if (!fs.existsSync(this.directory)) fs.mkdirSync(this.directory, { recursive: true });

      fs.writeFileSync(path0, JSON.stringify(initial as Content));
      return initial as Content;
    } else {
      return JSON.parse(fs.readFileSync(path0, 'utf8')) as Content;
    }
  }

  public get store() {
    return this.content;
  }

  protected __store() {
    fs.writeFileSync(this.path0, JSON.stringify(this.content), { encoding: 'utf8' });
  }
}
