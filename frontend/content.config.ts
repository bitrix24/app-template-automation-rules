import { defineContentConfig, defineCollection, z } from '@nuxt/content'
import type { DefinedCollection } from '@nuxt/content'
import { EActivityCategory } from './app/types'
import { contentLocales } from './i18n.map'

interface LocaleConfig {
  code: string
  name: string
  file: string
}

const getLocales = (): LocaleConfig[] => {
  try {
    const locales: unknown = contentLocales

    if (!Array.isArray(locales)) throw new Error('Invalid locales format')
    return locales.filter((l): l is LocaleConfig =>
      typeof l === 'object'
      && l !== null
      && 'code' in l
      && 'name' in l
      && 'file' in l
    )
  } catch (error) {
    console.error('Error parsing locales:', error)
    return []
  }
}

const locales = getLocales()

const activitySchema = z.object({
  title: z.string(),
  description: z.string(),
  categories: z.array(z.nativeEnum(EActivityCategory)).optional(),
  badges: z.array(z.string()).optional(),
  avatar: z.string().optional()
})

const isValidLocaleCode = (code: string): boolean => /^[a-z]{2}(?:-[A-Z]{2})?$/.test(code)

const createContentCollections = (locales: LocaleConfig[]): Record<string, DefinedCollection> => {
  return locales.reduce((acc, locale) => {
    if (!isValidLocaleCode(locale.code)) {
      console.warn(`Invalid locale code: ${locale.code}`)
      return acc
    }

    acc[`contentActivities_${locale.code}`] = defineCollection({
      source: `activities/${locale.code}/**/*.md`,
      type: 'page',
      schema: activitySchema
    })

    return acc
  }, {} as Record<string, DefinedCollection>)
}

export default defineContentConfig({
  collections: createContentCollections(locales)
})
