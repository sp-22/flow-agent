/// <reference types="vitest/globals" />
import { parseAdapterLine } from './adapter-protocol';

test('parses a valid JSON event line', () => {
  const e = parseAdapterLine('{"type":"result","ok":true,"summary":"done"}');
  expect(e).toEqual({ type: 'result', ok: true, summary: 'done' });
});

test('ignores blank and non-JSON noise lines', () => {
  expect(parseAdapterLine('')).toBeNull();
  expect(parseAdapterLine('   ')).toBeNull();
  expect(parseAdapterLine('not json at all')).toBeNull();
});

test('ignores JSON without a string type', () => {
  expect(parseAdapterLine('{"foo":1}')).toBeNull();
  expect(parseAdapterLine('[1,2,3]')).toBeNull();
});
