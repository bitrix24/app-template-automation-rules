import puppeteer from 'puppeteer-core'
import { appOptions } from '../app.config'
import type { Browser, Page } from 'puppeteer-core'
import { consola } from 'consola'

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
  const chromeUrl = appOptions().chromeUrl

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
  params: { token: string }
) {
  let browser: Browser | null = null
  try {
    browser = await connectToBrowser()
    const page = await browser.newPage()

    await page.setExtraHTTPHeaders({
     'Authorization': `Bearer ${params.token}`
    })
    const internalUrl = new URL(`${appOptions().appInternalUrl}${url}`)
    consola.log('make PDF for:', internalUrl.toString())

    await page.goto(
      internalUrl.toString(),
      {
        waitUntil: ['domcontentloaded', 'networkidle2'],
        timeout: 120_000
      }
    )

    consola.log('page wait >>>')
    await checkSSRCompleteness(page)

    consola.log('PDF generation >>>')
    /**
     * @memo some custom for page
     */
    await page.emulateMediaType('print')
    await page.addStyleTag({
      content: `
        @page { size: A4 portrait; }
      `
    })

    /**
     * @todo make config for options
     */
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    })

    await page.close()

    return pdfBuffer
  } catch (error) {
    consola.error('PDF generation error:', error)

    // Handling Puppeteer Specific Errors
    if (error instanceof Error) {
      // Page load timeout
      if (error.message.includes('Navigation timeout')) {
        throw new Error('Page loading timeout')
      }

      // Connection problems
      if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
        throw new Error('Connection refused')
      }

      // Invalid URL
      if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
        throw new Error('Invalid URL')
      }

      // Page not found
      if (error.message.includes('404')) {
        throw new Error('Page not found')
      }
    }

    // General default error
    throw new Error('PDF generation failed', { cause: error })
  } finally {
    await browser?.disconnect()
  }
}

const checkSSRCompleteness = async (page: Page) => {
  consola.log('wait __nuxt >>>')
  await page.waitForSelector('#__nuxt', { visible: true, timeout: 10_000 })
  /**
   * @see frontend/app/pages/render/invoice-by-deal/[id].server.vue
   */
  consola.log('wait .app-loading-indicator >>>')
  await page.waitForSelector('.app-loading-indicator', { hidden: true, timeout: 10_000 })
}
