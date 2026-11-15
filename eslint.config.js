// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const NO_PARENT = [
  ['../*'],
  'Import across folders with @domain/, @infrastructure/, @ui/ or @modules/; use ./ only in the same folder.',
];

// Text and TextInput come from the kit so the app's typefaces apply.
const NO_NATIVE_TEXT = {
  name: 'react-native',
  importNames: ['Text', 'TextInput'],
  message: 'Use Text and TextInput from @ui/kit, which apply the fonts.',
};

const KIT_TEXT_FILES = ['src/ui/kit/Text.tsx', 'src/ui/kit/TextInput.tsx'];

/**
 * One `no-restricted-imports` rule. Flat config replaces a rule rather than merging
 * it, so every area states all of its restrictions here.
 */
const forbid = (patterns, { text = true } = {}) => ({
  'no-restricted-imports': [
    'error',
    {
      patterns: [NO_PARENT, ...patterns].map(([group, message]) => ({ group, message })),
      paths: text ? [NO_NATIVE_TEXT] : [],
    },
  ],
});

// The UI in tiers: each tier only imports the tiers below it.
const UI_TIERS = {
  foundation: ['kit', 'state', 'features', 'screens'],
  kit: ['state', 'features', 'screens'],
  state: ['features', 'screens'],
  features: ['screens'],
};

const tierRule = (tier, options) =>
  forbid(
    [
      [
        UI_TIERS[tier].flatMap((t) => [`@ui/${t}`, `@ui/${t}/*`]),
        `ui/${tier} only imports the tiers below it.`,
      ],
    ],
    options,
  );

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  // Everywhere in src.
  { files: ['src/**/*.{ts,tsx}'], rules: forbid([]) },
  // Domain: pure rules and models, no platform, storage, UI or native modules.
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: forbid([
      [
        [
          'react',
          'react-native',
          'react-native/*',
          'react-dom',
          'expo',
          'expo-*',
          '@react-native-async-storage/*',
        ],
        'The domain is pure: no React, React Native, Expo or storage.',
      ],
      [
        ['@infrastructure/*', '@ui/*', '@modules/*'],
        'The domain imports nothing from infrastructure, ui or native modules.',
      ],
    ]),
  },
  // Infrastructure: adapts the outside world for the domain, never reaches into the UI.
  {
    files: ['src/infrastructure/**/*.{ts,tsx}'],
    rules: forbid([[['@ui/*'], 'Infrastructure never imports the UI; text arrives already translated.']]),
  },
  // UI tiers.
  ...Object.keys(UI_TIERS).map((tier) => ({
    files: [`src/ui/${tier}/**/*.{ts,tsx}`],
    rules: tierRule(tier),
  })),
  // The kit's own Text and TextInput are the only files that wrap React Native's.
  { files: KIT_TEXT_FILES, rules: tierRule('kit', { text: false }) },
]);
