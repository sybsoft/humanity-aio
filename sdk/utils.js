import chalk from 'chalk'
import figlet from 'figlet'
import cliProgress from 'cli-progress'
import { consola } from 'consola'
import config from './config.js'
import crypto from 'crypto'

export const printGreetingMessage = () => {
    console.log(
        chalk.green.bold(
            figlet.textSync('SYBILYCH', {
                font: 'Small Slant',
                horizontalLayout: 'default',
                verticalLayout: 'default',
                width: 80,
                whitespaceBreak: true
            })
        )
    )
}

export const clickForSelector = async (page, selector, timeout = 10000) => {
    await page.waitForSelector(selector, { timeout: timeout })
    const element = await page.$(selector)
    if (element) {
        await element.click()
    } else {
        consola.error('Element not found')
    }
}

export const sleep = async (min, max, silent = false) => {
    const duration = Math.floor(Math.random() * (max - min + 1)) + min

    if (!silent) {
        consola.info(`Sleeping for ${duration} seconds`)
        const bar = new cliProgress.SingleBar({}, cliProgress.Presets.rect)
        bar.start(duration, 0)
        for (let i = 0; i < duration; i++) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            bar.update(i + 1)
        }
        bar.stop()
    } else {
        await new Promise((resolve) => setTimeout(resolve, duration * 1000))
    }
}

export const randomInteger = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export const shuffleArray = (array) => {
    if (config.SHUFFLE_ACCOUNTS === false) {
        return array
    }

    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[array[i], array[j]] = [array[j], array[i]]
    }

    return array
}

export const generateNonce = (length = 17) => {
    const charset =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let nonce = ''
    const randomBytes = crypto.randomBytes(length)
    for (let i = 0; i < length; i++) {
        nonce += charset[randomBytes[i] % charset.length]
    }

    return nonce
}
