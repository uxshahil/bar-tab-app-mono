import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}']
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  skipFormatting,

  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'no-restricted-imports': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'vue',
              message: 'Using unplugin-auto-import: Please remove this explicit import.',
              allowTypeImports: true
            },
            {
              name: 'vue-router',
              message: 'Using unplugin-auto-import: Please remove this explicit import.',
              allowTypeImports: true
            },
            {
              name: 'pinia',
              importNames: ['defineStore', 'storeToRefs', 'acceptHMRUpdate'],
              message: 'This Pinia function is auto-imported. Please remove the explicit import.',
              allowTypeImports: true
            },
            {
              name: 'vue-meta',
              importNames: ['useMeta'],
              message: 'This vue-meta function is auto-imported. Please remove the explicit import.',
              allowTypeImports: true
            }
          ],
          patterns: [
            {
              group: ['@/components/*'],
              message: 'Components are globally auto-imported by unplugin-vue-components. Please remove explicit imports.',
              allowTypeImports: true
            },
            {
              group: ['@/composables/*'],
              message: 'Composables are globally auto-imported by unplugin-auto-import. Please remove explicit imports.',
              allowTypeImports: true
            },
            {
              group: ['@/stores/*'],
              message: 'Stores are globally auto-imported by unplugin-auto-import. Please remove explicit imports.',
              allowTypeImports: true
            }
          ]
        }
      ]

    }
  }
)
