import { fileURLToPath, URL } from 'node:url'
import VueRouter from 'unplugin-vue-router/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'

import Components from 'unplugin-vue-components/vite'

import tailwindcss from '@tailwindcss/vite'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    VueRouter(),
    Components(),
    AutoImport({
      // targets to transform
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.vue\.[tj]sx?\?vue/, // .vue (vue-loader with experimentalInlineMatchResource enabled)
        /\.md$/ // .md
      ],

      // global imports to register
      imports: [
        // presets
        'vue',
        VueRouterAutoImports,
        { 'vue-router': ['RouterLink'] },
        { pinia: ['defineStore', 'storeToRefs', 'acceptHMRUpdate'] },
        {
          'vue-meta': ['useMeta']
        },
        { '@vueuse/core': ['useMemoize'] },
        { '@tanstack/vue-table': ['useVueTable', 'getCoreRowModel', 'getPaginationRowModel', 'FlexRender'] }
      ],
      // Filepath to generate corresponding .d.ts file.
      // Defaults to './auto-imports.d.ts' when `typescript` is installed locally.
      // Set `false` to disable.
      dts: true,

      // Include auto-imported packages in Vite's `optimizeDeps` options
      // Recommend to enable
      viteOptimizeDeps: true,

      dirs: [
        './src/stores/**',
        './src/composables/**',
        './src/services/api/**',
        './src/interfaces/**',
        './src/services/supabase/queries/**',
        './src/utils/**',
        './src/providers/**',
        './src/services/socket/**'
      ],

      // Enable auto import by filename for default module exports under directories
      defaultExportByFilename: false,

      // Auto import for module exports under directories
      // by default it only scan one level of modules under the directory
      vueTemplate: true,
    }),
    vue({
      template: {
        compilerOptions: {
          isCustomElement: element => element.startsWith('iconify-icon')
        }
      }
    }),
    tailwindcss(),
    vueDevTools()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true,
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  },
})
