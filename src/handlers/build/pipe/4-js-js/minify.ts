import uglify from 'uglify-js';

export function minify_file_code(code: string) {
  const minified = uglify.minify(code);
  return minified.code;
}
