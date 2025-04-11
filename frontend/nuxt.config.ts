import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { contentLocales } from './i18n.map'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@bitrix24/b24ui-nuxt',
    '@nuxt/eslint',
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    '@bitrix24/b24jssdk-nuxt'
  ],
  /**
   * @memo; on - speed render pages
   */
  ssr: true,
  // ssr: false,
  /**
   * @memo App work under frame
   * Nuxt DevTools: Failed to check parent window
   * SecurityError: Failed to read a named property '__NUXT_DEVTOOLS_DISABLE__' from 'Window'
   */
  devtools: { enabled: false },

  css: ['~/assets/css/main.css'],
  content: {
    /**
     * @memo: Under Docker::Nginx not use
     */
    watch: {
      enabled: false
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.VITE_NUXT_JWT_SECRET || 'super-secret-key',
    allowedIPs: process.env.VITE_ALLOWED_IPS?.split(',') || ['127.0.0.1', '::1'],
    public: {
      contentLocales: contentLocales
    }
  },
  build: {
    transpile: [
      'jsonwebtoken'
    ]
  },
  devServer: {
    port: 3000,
    // @todo use env for docker
    host: '0.0.0.0',
    // @todo use for tuna
    // host: '127.0.0.1',
    loadingTemplate: () => {
      return readFileSync('./template/devServer-loading.html', 'utf-8')
    }
  },
  future: {
    compatibilityVersion: 4
  },

  compatibilityDate: '2024-11-27',

  vite: {
    plugins: [
      tailwindcss()
    ]
  },
  i18n: {
    bundle: {
      optimizeTranslationDirective: false
    },
    detectBrowserLanguage: false,
    strategy: 'no_prefix',
    lazy: true,
    defaultLocale: 'en',
    locales: contentLocales
  }
})
