import globals from 'globals';
import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default [
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPrettierRecommended
];
