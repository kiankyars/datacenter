import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/vendor/**', 'node_modules/**'] },
  js.configs.recommended,
  { files: ['dist/**/*.js'], languageOptions: { globals: globals.browser } },
  { files: ['server.mjs', 'scripts/**', 'eslint.config.js'], languageOptions: { globals: globals.node } },
  // Test callbacks passed to page.evaluate run in the browser.
  { files: ['tests/**'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
];
