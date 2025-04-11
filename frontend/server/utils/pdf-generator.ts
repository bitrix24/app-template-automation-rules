import puppeteer from 'puppeteer-core'
import type { Browser } from 'puppeteer-core'
import { createSSRApp } from 'vue'
import { createMemoryHistory } from 'vue-router'
// import { defineAsyncComponent } from '#imports'
import { renderToString } from 'vue/server-renderer'

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

    /**
     * @memo ??
     */
    const warmupPage = await browser.newPage()
    await warmupPage.goto('about:blank')
    await warmupPage.close()
  }
  return browser
}

export async function generatePDF(
  url: string,
  params: { token: string, taskId: string }
) {
  const metrics = {
    startTotal: Date.now(),
    appRender: 0,
    browserInit: 0,
    pdfGen: 0
  }

  try {
    const connectStart = Date.now();
    const browser = await connectToBrowser()
    const connectTime = Date.now() - connectStart;

    const pageStart = Date.now();
    const page = await browser.newPage()
    /**
     * @memo some custom for page
     * @todo remove this
     */

    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'reduce' }
    ])
    await page.emulateMediaType('screen')
    // await page.setJavaScriptEnabled(false)

    /**
     * @todo remove this
     */
    //
    // await page.addStyleTag({
    //   content: `
    //     @page { size: A4 landscape; }
    //     body { font-family: Arial; }
    //   `
    // })

    const pageTime = Date.now() - pageStart;

    const { token, taskId } = params

    const contentStart = Date.now();

    console.log(' >> 2.1', url)
    let urlFix = `http://0.0.0.0:3000${url}`
    urlFix = `http://127.0.0.1:3000${url}`
    // urlFix = `http://172.21.0.2:3000${url}`
    console.log(' >> 2.2', urlFix)

    const finalUrl = new URL(urlFix)
    finalUrl.searchParams.set('taskId', taskId)

    await page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${token}`,
      'X-Forwarded-For': '127.0.0.1'
    })

    console.log(' >> 2.f', finalUrl.toString())

    await page.goto(finalUrl.toString(), {
      // waitUntil: 'domcontentloaded',
      // timeout: 15000
      waitUntil: 'networkidle0',
      timeout: 60000
      // timeout: 3000
      // timeout: 60000
    })


    const contentTime = Date.now() - contentStart;

    const pdfStart = Date.now();
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
    const pdfTime = Date.now() - pdfStart;

    const pageClose = Date.now();
    await page.close()
    const pageCloseTime = Date.now() - pageClose;

    console.log(JSON.stringify({
      connectTime,
      pageTime,
      contentTime,
      pdfTime,
      pageCloseTime,
      total: Date.now() - metrics.startTotal
    }));

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
