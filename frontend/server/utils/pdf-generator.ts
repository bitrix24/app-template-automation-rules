import puppeteer from 'puppeteer-core'
import type { Browser } from 'puppeteer-core'

/**
 * Generates PDF relative to page
 */

let browser: Browser | null = null

/**
 * @todo add health-check
 */
const connectToBrowser = async () => {
  if (!browser) {
    const debugInfo = await fetch('http://127.0.0.1:9222/json/version')
      .then(res => res.json())

    browser = await puppeteer.connect({
      browserWSEndpoint: debugInfo.webSocketDebuggerUrl,
      defaultViewport: null
    })
  }
  return browser
}

export async function generatePDF(
  url: string,
  params: { token: string, taskId: string }
) {
  try {
    const browser = await connectToBrowser()

    const page = await browser.newPage()

    const { token, taskId } = params

    console.log(' >> 2.1', url)
    url = `http://127.0.0.1:3000${url}`
    console.log(' >> 2.2', url)

    const finalUrl = new URL(url)
    finalUrl.searchParams.set('taskId', taskId)

    await page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${token}`,
      'X-Forwarded-For': '127.0.0.1'
    })

    console.log(' >> 2', finalUrl.toString())
    await page.goto(finalUrl.toString(), {
      waitUntil: 'networkidle0',
      timeout: 60000
    })

    /**
     * @memo some custom for page
     * @todo remove this
     */
    await page.emulateMediaType('screen')
    await page.addStyleTag({
      content: `
        @page { size: A4 landscape; }
        body { font-family: Arial; }
      `
    })

    /**
     * @todo make config for margin
     */
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
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
    throw createError({
      statusCode: 500,
      statusMessage: 'PDF generation failed',
      data: {
        originalError: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}
