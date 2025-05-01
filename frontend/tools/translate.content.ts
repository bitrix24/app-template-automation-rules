/**
 * Translate content/activities/*\/*.md
 * @see https://platform.deepseek.com/usage
 *
 * @use node ./tools/translate.content.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { createInterface } from 'node:readline/promises'
import OpenAI from 'openai'
import { config } from 'dotenv'
import { contentLocales } from './../i18n.map'

config({ path: '.env' })

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

const EXCLUDED_WORDS = ['AI', 'CRM', 'Bitrix24']
const CONTENT_PATH = './content/activities'

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY
})

async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{
        role: 'user',
        content: `Translate the following Markdown text from ${sourceLang} to ${targetLang}.
                  Keep all Markdown formatting, code blocks, links and placeholders intact.
                  Don't translate: ${EXCLUDED_WORDS.join(', ')}.
                  Never add explanations.
                  Return only the translation without any additional text or quotes.
                  Text: ${text}`
      }],
      temperature: 1.3
    })

    if (null === completion) {
      return ''
    }
    return (((completion.choices[0] || {})?.message || {}).content || '')
      .replaceAll('```markdown', '')
      .replaceAll('```', '')
      .trim()
  } catch (error) {
    console.error('Translation error:', (error instanceof Error) ? error?.message : error)
    return text
  }
}

async function clearDirectory(dir: string) {
  try {
    await fs.access(dir)
    const files = await fs.readdir(dir)
    await Promise.all(files.map(file =>
      fs.unlink(path.join(dir, file))
    ))
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

async function main() {
  try {
    // Get available locales
    const items = await fs.readdir(CONTENT_PATH, { withFileTypes: true })
    const locales = items
      .filter(item => item.isDirectory())
      .map(item => item.name)

    if (locales.length < 2) {
      throw new Error('Need at least 2 locale directories')
    }

    // Select source language
    console.log('Available locales:', locales.join(', '))
    const sourceLang = await rl.question('Enter source locale: ')
    if (!locales.includes(sourceLang)) {
      throw new Error(`Main locale ${sourceLang} not found`)
    }

    const localeInfo: Record<string, {
      code: string
      name: string
      file: string
    }> = {}
    contentLocales.forEach((row) => {
      localeInfo[row.code] = row
    })

    // Get source files
    const sourceDir = path.join(CONTENT_PATH, sourceLang)
    const files = (await fs.readdir(sourceDir)).filter(f => f.endsWith('.md'))

    // Process target languages
    for (const targetLang of locales.filter(l => l !== sourceLang)) {
      const targetDir = path.join(CONTENT_PATH, targetLang)

      console.log(`\nProcessing [${localeInfo[targetLang]?.name || '??'} (${localeInfo[targetLang]?.code || targetLang})]:`)
      await clearDirectory(targetDir)

      for (const file of files) {
        const sourcePath = path.join(sourceDir, file)
        const targetPath = path.join(targetDir, file)

        console.log(`Translating ${file}...`)
        const mainData = await fs.readFile(sourcePath, 'utf-8')
        const translated = await translateText(
          mainData,
          `${localeInfo[sourceLang]?.name || '??'} (${localeInfo[sourceLang]?.code || targetLang})`,
          `${localeInfo[targetLang]?.name} (${localeInfo[targetLang]?.code || targetLang})`
        )

        await fs.writeFile(targetPath, translated)
      }

      console.log(`✅ Successfully translated ${files.length} files to ${targetLang}`)
    }
  } catch (error) {
    console.error('Error:', (error instanceof Error) ? error?.message : error)
  } finally {
    rl.close()
  }
}

main()
