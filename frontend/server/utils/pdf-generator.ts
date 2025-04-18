/*
frontend  | ws://chrome:9222/devtools/browser/c47972fe-9f50-49cd-8cf0-339ba8cf765b
frontend  | Connected to browser: Chrome/124.0.6367.78
frontend  | make PDF for:  https://bitrix24.com/
frontend  | ℹ ✨ new dependencies optimized: @bitrix24/b24icons-vue/main/FileCheckIcon, @bitrix24/b24icons-vue/main/SettingsIcon, @bitrix24/b24icons-vue/button/SearchIcon, @bitrix24/b24icons-vue/main/CheckIcon, @bitrix24/b24icons-vue/main/Market1Icon, @bitrix24/b24icons-vue/specialized/SpinnerIcon, @bitrix24/b24icons-vue/main/AttentionIIcon, fuse.js, @vueuse/core
frontend  | ℹ ✨ optimized dependencies changed. reloading
frontend  |
frontend  |  ERROR  [unhandledRejection] write EPIPE
frontend  |
frontend  |     at afterWriteDispatched (node:internal/stream_base_commons:159:15)
frontend  |     at writeGeneric (node:internal/stream_base_commons:150:3)
frontend  |     at Socket._writeGeneric (node:net:971:11)
frontend  |     at Socket._write (node:net:983:8)
frontend  |     at writeOrBuffer (node:internal/streams/writable:572:12)
frontend  |     at _write (node:internal/streams/writable:501:10)
frontend  |     at Writable.write (node:internal/streams/writable:510:10)
frontend  |     at Socket.ondata (node:internal/streams/readable:1009:22)
frontend  |     at Socket.emit (node:events:518:28)
frontend  |     at addChunk (node:internal/streams/readable:561:12)
frontend  |     at readableAddChunkPushByteMode (node:internal/streams/readable:512:3)
frontend  |     at Readable.push (node:internal/streams/readable:392:5)
frontend  |     at TCP.onStreamRead (node:internal/stream_base_commons:189:23)
frontend  |


 */
import puppeteer from 'puppeteer-core'
import { sleepAction } from '../../app/utils/sleep'
import type { Browser } from 'puppeteer-core'

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
  const config = useRuntimeConfig()
  let chromeUrl = config.chromeUrl

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

export async function generatePDF(url: string, params: { token: string, taskId: string }) {
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

    //await page.setExtraHTTPHeaders({
    //  'Authorization': `Bearer ${params.token}`,
	  //  'X-Forwarded-For': '127.0.0.1',
	  //  'X-Forwarded-For': '172.18.0.3',
    //  'X-Forwarded-Proto': 'http',
    //  'Host': 'localhost'
    //})

    /**
     * @todo get from APP_INTERNAL_URL
     */
    let internalUrl = new URL(`http://frontend:3000${url}`)
    internalUrl.searchParams.set('taskId', params.taskId)


    //internalUrl = new URL(`https://bitrix24.com`)

    console.log('make PDF for: ', internalUrl.toString())

    await page.goto(
      internalUrl.toString(),
      {
        waitUntil: 'networkidle2',
        timeout: 120_000
      }
    )

    await sleepAction(3_000)

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
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
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
  } finally {
    await browser?.disconnect()
  }
}
