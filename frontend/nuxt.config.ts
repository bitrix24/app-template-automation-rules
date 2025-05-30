import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { contentLocales } from './i18n.map'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@bitrix24/b24ui-nuxt',
    '@bitrix24/b24jssdk-nuxt',
    '@nuxt/eslint',
    '@nuxt/content',
    '@nuxtjs/i18n',
    '@pinia/nuxt'
  ],
  ssr: true,
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
    /**
     * @memo this will be overwritten from .env or Docker_*
     *
     * @see https://nuxt.com/docs/guide/going-further/runtime-config#example
     */
    chromeUrl: '',
    rabbitmqUrl: '',
    appInternalUrl: '',
    jwtSecret: '',
    allowedIps: '',
    appClientId: '',
    appClientSecret: '',
    appScope: '',
    public: {
      contentLocales: contentLocales,
      appUrl: ''
    }
  },
  build: {
    transpile: [
      'jsonwebtoken'
    ]
  },
  devServer: {
    loadingTemplate: () => {
      return readFileSync('./template/devServer-loading.html', 'utf-8')
    }
  },
  future: {
    compatibilityVersion: 4
  },
  compatibilityDate: '2024-11-27',
  nitro: {
    /**
     * @memo bug prisma -> https://github.com/prisma/prisma/issues/26908#issuecomment-2818964476
     */
    replace: {
      'import * as process': 'import * as processUnused'
    }
  },
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
