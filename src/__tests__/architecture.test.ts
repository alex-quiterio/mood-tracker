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

describe('imports', () => {
  it.each(filesIn(SRC).map((f) => relative(SRC, f)))('%s uses path aliases instead of ../', (file) => {
    expect(importsOf(join(SRC, file)).filter((spec) => spec.startsWith('../'))).toEqual([]);
  });
});

/**
 * The UI in tiers: foundation (i18n, theme, voices) under a kit of plain components,
 * app-wide state, features, and the screens that compose them. Each tier only
 * imports the tiers below it.
 */
describe('ui tiers', () => {
  const above: Record<string, string[]> = {
    foundation: ['kit', 'state', 'features', 'screens'],
    kit: ['state', 'features', 'screens'],
    state: ['features', 'screens'],
    features: ['screens'],
  };

  it.each(
    Object.keys(above).flatMap((tier) =>
      filesIn(join(SRC, 'ui', tier)).map((f) => [relative(SRC, f), tier] as const),
    ),
  )('%s only imports lower tiers', (file, tier) => {
    const bad = importsOf(join(SRC, file)).filter((spec) =>
      above[tier].some((t) => spec.startsWith(`@ui/${t}/`)),
    );
    expect(bad).toEqual([]);
  });
});

/** Text is drawn in the app's typefaces: everything goes through the kit's Text and TextInput. */
describe('typefaces', () => {
  const wrappers = ['ui/kit/Text.tsx', 'ui/kit/TextInput.tsx'];
  it.each(
    filesIn(SRC)
      .map((f) => relative(SRC, f))
      .filter((f) => !wrappers.includes(f)),
  )('%s takes Text and TextInput from the kit', (file) => {
    const source = readFileSync(join(SRC, file), 'utf8');
    const native = [...source.matchAll(/import \{([^}]*)\} from 'react-native'/g)].flatMap((m) =>
      m[1].split(',').map((n) => n.trim()),
    );
    expect(native.filter((n) => n === 'Text' || n === 'TextInput')).toEqual([]);
  });
});
