/**
 * Translate i18n/locales
 * @see https://platform.deepseek.com/usage
 *
 * @use node ./tools/translate.ui.mjs
 * @use node ./tools/translate.ui.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { createInterface } from 'node:readline/promises'
import OpenAI from 'openai'
import { config } from 'dotenv'

config({ path: '.env.development' })
config({ path: '.env' })

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

const EXCLUDED_WORDS = ['AI', 'CRM', 'Bitrix24']
const CONTENT_PATH = './i18n/locales'

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
})

const getLocalesInfo = () => {
  try {
    const rawLocales = process.env.NUXT_PUBLIC_CONTENT_LOCALES || '[]'
    const locales = JSON.parse(rawLocales)

    if (!Array.isArray(locales)) throw new Error('Invalid locales format')
    return locales.filter(l =>
      typeof l === 'object' && l !== null && 'code' in l && 'name' in l && 'file' in l
    )
  } catch (error) {
    console.error('Error parsing locales:', error)
    return []
  }
}

async function translateText(text, sourceLang, targetLang) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{
        role: 'user',
        content: `Translate the following JSON value from ${sourceLang} to ${targetLang}.
                  Keep all placeholders like {0}, {name} intact.
                  Don't translate: ${EXCLUDED_WORDS.join(', ')}.
                  Never add explanations.
                  Return only the translation without any additional text or quotes.
                  Text: ${JSON.stringify(text)}`
      }],
      temperature: 1.3
    })

    return completion.choices[0].message.content.trim()
  } catch (error) {
    console.error('Translation error:', error.message)
    return text
  }
}

async function main() {
  try {
    // Getting a list of languages
    const files = await fs.readdir(CONTENT_PATH)
    const locales = files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))

    if (locales.length < 2) {
      throw new Error('Need at least 2 locale files')
    }

    // Select source language
    console.log('Available locales:', locales.join(', '))
    let sourceLang = await rl.question('Enter source locale: ')
    if (!locales.includes(sourceLang)) {
      throw new Error(`Main locale ${sourceLang} not found`)
    }

    // Loading the main language
    const mainPath = path.join(CONTENT_PATH, `${sourceLang}.json`)
    const mainData = JSON.parse(await fs.readFile(mainPath, 'utf-8'))

    const localeInfo = {}
    getLocalesInfo().forEach((row) => {
      localeInfo[row.code] = row
    })

    // Processing other languages
    for (const locale of locales.filter(l => l !== sourceLang)) {
      const localePath = path.join(CONTENT_PATH, `${locale}.json`)

      console.log(`Translating [${localeInfo[sourceLang].name} (${localeInfo[sourceLang].code})] to [${localeInfo[locale].name} (${localeInfo[locale].code})] ...`)

      // Translation and update
      const translated = await translateText(
        mainData,
        `${localeInfo[sourceLang].name} (${localeInfo[sourceLang].code})`,
        `${localeInfo[locale].name} (${localeInfo[locale].code})`
      )
      const saveData = JSON.parse(translated)

      // Saving the updated file
      await fs.writeFile(localePath, JSON.stringify(saveData, null, 2) + '\n')
      console.log(`✅ Successfully updated ${locale}.json\n`)
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    rl.close()
  }
}

main()
