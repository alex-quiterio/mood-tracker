import { describe, expect, it } from '@jest/globals';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

const SRC = join(__dirname, '..');

function filesIn(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesIn(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

const importsOf = (file: string) =>
  [...readFileSync(file, 'utf8').matchAll(/from '([^']+)'/g)].map((m) => m[1]);

/** The domain is pure: rules and models only, no UI, platform or storage. */
describe('domain layer', () => {
  const forbidden = [
    /^react$/,
    /^react-native/,
    /^expo/,
    /^@react-native-async-storage/,
    /infrastructure\//,
    /ui\//,
    /modules\//,
  ];

  it.each(filesIn(join(SRC, 'domain')).map((f) => relative(SRC, f)))(
    '%s imports nothing outside the domain',
    (file) => {
      const bad = importsOf(join(SRC, file)).filter((spec) => forbidden.some((re) => re.test(spec)));
      expect(bad).toEqual([]);
    },
  );
});

/** Infrastructure adapts the outside world for the domain; it never reaches into the UI. */
describe('infrastructure layer', () => {
  it.each(filesIn(join(SRC, 'infrastructure')).map((f) => relative(SRC, f)))(
    '%s does not import the UI',
    (file) => {
      expect(importsOf(join(SRC, file)).filter((spec) => /ui\//.test(spec))).toEqual([]);
    },
  );
});

describe('layout', () => {
  it('keeps src/ free of loose files', () => {
    const loose = readdirSync(SRC).filter((name) => statSync(join(SRC, name)).isFile());
    expect(loose).toEqual([]);
  });
});
