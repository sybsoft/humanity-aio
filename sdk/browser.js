import { chromium } from 'playwright'
import { newInjectedContext } from 'fingerprint-injector'
import fs from 'fs'
import consola from 'consola'

export const getDefaultBrowserSession = async (proxy, headless = false) => {
    let proxy_obj = {}

    if (proxy !== null) {
        const proxy_splitted = proxy.split('@')
        const [proxy_username, proxy_password] = proxy_splitted[0].split(':')
        const proxyHost = proxy_splitted[1]

        proxy_obj = {
            server: proxyHost,
            username: proxy_username,
            password: proxy_password
        }
    }

    const browser = await chromium.launch({ headless: headless })

    const context = await newInjectedContext(browser, {
        newContextOptions: {
            proxy: proxy_obj
        }
    })

    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false })
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en']
        })
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] })
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => 4
        })
        Object.defineProperty(navigator, 'appVersion', {
            get: () => '5.0 (Windows)'
        })
    })

    return { browser, context }
}

export const getAccountBrowserSession = async (
    account_id,
    headless = false
) => {
    const browser = await chromium.launch({ headless: headless })

    let proxy_obj = {}

    if (PROXY_URL) {
        const proxy_splitted = PROXY_URL.split('@')
        const [proxy_username, proxy_password] = proxy_splitted[0].split(':')
        const proxyHost = proxy_splitted[1]

        proxy_obj = {
            server: proxyHost,
            username: proxy_username,
            password: proxy_password
        }
    }

    const storage = JSON.parse(
        fs.readFileSync(`data/sessions/${account_id}-session.json`, 'utf8')
    )
    const restoredContext = await browser.newContext({
        storageState: storage,
        proxy: proxy_obj
    })

    await browser.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false })
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en']
        })
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] })
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => 4
        })
        Object.defineProperty(navigator, 'appVersion', {
            get: () => '5.0 (Windows)'
        })
    })

    const browserData = { browser, context: restoredContext }
    return browserData
}

export const saveBrowserSession = async (context, fileName) => {
    const storage = await context.storageState()

    const filePath = `data/sessions/${fileName}.json`
    fs.writeFileSync(filePath, JSON.stringify(storage))

    consola.success('Session Saved')

    return true
}
