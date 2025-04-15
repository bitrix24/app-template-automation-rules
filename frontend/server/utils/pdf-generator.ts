import puppeteer from 'puppeteer-core'
import type { Browser, Page } from 'puppeteer-core'

const connectToBrowser = async () => {
  const config = useRuntimeConfig()
  let chromeWsUrl = config.chromeWsUrl
  chromeWsUrl = 'ws://chrome:9222'
  //chromeWsUrl = 'ws://127.0.0.1:9222'
  //chromeWsUrl = 'ws://172.18.0.2:9222'
  chromeWsUrl = 'ws://localhost:9222/devtools/browser/681db58e-5333-4a98-be6b-40ec68a5ffd7'
  chromeWsUrl = 'ws://172.18.0.2:9222/devtools/browser/681db58e-5333-4a98-be6b-40ec68a5ffd7'
  
  // @todo get from  docker exec -it chrome wget -qO- http://localhost:9222/json/version
  chromeWsUrl = 'ws://chrome:9222/devtools/browser/436934d3-dec5-4cf8-a250-88d674592369"'
  console.log(chromeWsUrl)
  const browser = await puppeteer.connect({
    browserWSEndpoint: chromeWsUrl,
    defaultViewport: null,
    // ignoreHTTPSErrors: true,
    // protocolTimeout: 60000
  })

  // Проверка соединения
  const version = await browser.version()
  console.log('Connected to browser:', version)
  return browser
}

export async function generatePDF(url: string, params: { token: string, taskId: string }) {
  let browser: Browser | null = null
  try {
    browser = await connectToBrowser()
    const page = await browser.newPage()

    // Настройка прокси для внутреннего трафика
    await page.setRequestInterception(true)
    page.on('request', req => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort()
      } else {
        req.continue()
      }
    })

    // Явное указание заголовков
    //await page.setExtraHTTPHeaders({
    //  'Authorization': `Bearer ${params.token}`,
	//  'X-Forwarded-For': '172.18.0.3',
    //  'X-Forwarded-Proto': 'http',
    //  'Host': 'local'
    //})

    // Использование внутреннего URL

    let internalUrl = ''
	internalUrl = new URL(`http://frontend:3000${url}`)
    internalUrl.searchParams.set('taskId', params.taskId)

console.log(internalUrl.toString())

    await page.goto(internalUrl.toString(), {
      waitUntil: 'networkidle2',
      timeout: 60000
    })

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    })
  } finally {
    await browser?.disconnect()
  }
}
