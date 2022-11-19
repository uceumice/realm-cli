import byteSize from 'byte-size';

export function getObjectSize(smth: any) {
  return byteSize(Buffer.byteLength(JSON.stringify(smth), 'utf8'));
}
