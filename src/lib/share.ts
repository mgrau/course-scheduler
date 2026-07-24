import type { Schedule } from './types';
import { fromYaml, toYaml } from './yaml-io';

async function pipe(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** Pack a schedule's YAML into a URL-hash-safe string. */
export async function encodeShare(s: Schedule): Promise<string> {
  const yaml = new TextEncoder().encode(toYaml(s));
  return b64urlEncode(await pipe(yaml, new CompressionStream('deflate-raw')));
}

/** Inverse of encodeShare; throws on malformed input. */
export async function decodeShare(data: string): Promise<Schedule> {
  const yaml = await pipe(b64urlDecode(data), new DecompressionStream('deflate-raw'));
  return fromYaml(new TextDecoder().decode(yaml));
}
