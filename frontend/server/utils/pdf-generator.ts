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
import type { Browser, Page } from 'puppeteer-core'

const connectToBrowser = async () => {
  const config = useRuntimeConfig()
  let chromeWsUrl = config.chromeWsUrl

  // @todo get from  docker exec -it frontend wget -qO- http://chrome:9222/json/version
  chromeWsUrl = 'ws://chrome:9222/devtools/browser/7dda554f-64fb-4d8e-938d-4f56bffd87d1'
  console.log(chromeWsUrl)
  const browser = await puppeteer.connect({
    browserWSEndpoint: chromeWsUrl,
    defaultViewport: null,
    // ignoreHTTPSErrors: true,
    // protocolTimeout: 60000
  })

  const version = await browser.version()
  console.log('Connected to browser:', version)
  return browser
}

async function sleepAction2(timeout: number = 1000): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, timeout))
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
	  //  'X-Forwarded-For': '172.18.0.3',
    //  'X-Forwarded-Proto': 'http',
    //  'Host': 'local'
    //})

    let internalUrl = new URL(`http://frontend:3000${url}`)
    internalUrl.searchParams.set('taskId', params.taskId)


    // internalUrl = new URL(`https://bitrix24.com`)

    console.log('make PDF for: ', internalUrl.toString())

    await page.goto(internalUrl.toString(), {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    await sleepAction2(3_000)

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    })
  } finally {
    await browser?.disconnect()
  }
}
