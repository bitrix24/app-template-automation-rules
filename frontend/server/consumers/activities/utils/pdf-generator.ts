/*
frontend  | ws://chrome:9222/devtools/browser/c47972fe-9f50-49cd-8cf0-339ba8cf765b
frontend  | Connected to browser: Chrome/124.0.6367.78
frontend  | make PDF for:  https://bitrix24.com/
frontend  | ℹ ✨ new dependencies optimized: @bitrix24/b24icons-vue/main/FileCheckIcon, @bitrix24/b24icons-vue/main/SettingsIcon, @bitrix24/b24icons-vue/button/SearchIcon, @bitrix24/b24icons-vue/main/CheckIcon, @bitrix24/b24icons-vue/main/Market1Icon, @bitrix24/b24icons-vue/specialized/SpinnerIcon, @bitrix24/b24icons-vue/main/AttentionIIcon, fuse.js, @vueuse/core
frontend  | ℹ ✨ optimized dependencies changed. reloading
frontend  |
frontend  |  ERROR  [unhandledRejection] write EPIPE
frontend  |
 */
import puppeteer from 'puppeteer-core'
// import { sleepAction } from '../../app/utils/sleep'
import type { Browser, Page } from 'puppeteer-core'
import { config } from 'dotenv'

config({ path: '.env' })

function transformWsUrl(
  httpUrl: string,
  wsUrl: string
): string {
  const firstUrl = new URL(httpUrl)
  const secondUrl = new URL(wsUrl)

  secondUrl.host = firstUrl.host

  return secondUrl.toString()
}

const connectToBrowser = async () => {
  const chromeUrl = process.env?.NUXT_CHROME_URL || '?'

  console.log('Connected chromeUrl:', chromeUrl)

  const chromeInfo = await fetch(chromeUrl)
    .then(res => res.json())

  const browser = await puppeteer.connect({
    browserWSEndpoint: transformWsUrl(chromeUrl, chromeInfo.webSocketDebuggerUrl),
    defaultViewport: null
  })

  const version = await browser.version()
  console.log('Connected to browser:', version)

  return browser
}

export async function generatePDF(
  url: string,
  params: { token: string, entityId: string | number }
) {
  let browser: Browser | null = null
  try {
    browser = await connectToBrowser()
    const page = await browser.newPage()

    // await page.setRequestInterception(true)
    // page.on('request', req => {
    //   if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
    //     req.abort()
    //   } else {
    //     req.continue()
    //   }
    // })

    // await page.setExtraHTTPHeaders({
    //  'Authorization': `Bearer ${params.token}`,
    //  'X-Forwarded-For': '127.0.0.1',
    //  'X-Forwarded-For': '172.18.0.3',
    //  'X-Forwarded-Proto': 'http',
    //  'Host': 'localhost'
    // })
    const internalUrl = new URL(`${process.env?.NUXT_APP_INTERNAL_URL || '?'}${url}`)
    console.log('make PDF for: ', internalUrl.toString())

    await page.goto(
      internalUrl.toString(),
      {
        waitUntil: ['domcontentloaded', 'networkidle2'],
        timeout: 120_000
      }
    )

    console.log('page wait >>>')
    await checkSSRCompleteness(page)

    console.log('PDF generation >>>')
    /**
     * @memo some custom for page
     * @todo remove this
     */
    await page.emulateMediaType('print')
    await page.addStyleTag({
      content: `
        @page { size: A4 portrait; }
      `
    })

    /**
     * @todo make config for margin
     */
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    })

    await page.close()

    return pdfBuffer
  } catch (error) {
    console.error('PDF generation error:', error)

    // Handling Puppeteer Specific Errors
    if (error instanceof Error) {
      // Page load timeout
      if (error.message.includes('Navigation timeout')) {
        throw createError({
          statusCode: 504,
          statusMessage: 'Page loading timeout'
        })
      }

      // Connection problems
      if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
        throw createError({
          statusCode: 502,
          statusMessage: 'Connection refused'
        })
      }

      // Invalid URL
      if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid URL'
        })
      }

      // Page not found
      if (error.message.includes('404')) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Page not found'
        })
      }
    }

    // General default error
    throw new Error('PDF generation failed', { cause: error })
  } finally {
    await browser?.disconnect()
  }
}

const checkSSRCompleteness = async (page: Page) => {
  console.log('wait __nuxt >>>')
  await page.waitForSelector('#__nuxt', { visible: true, timeout: 10_000 })
  console.log('wait .app-loading-indicator >>>')
  await page.waitForSelector('.app-loading-indicator', { hidden: true, timeout: 10_000 })
}
