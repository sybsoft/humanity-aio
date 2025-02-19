import { consola } from 'consola'

import {
    solveRegistration,
    seedLocalStorage,
    getToken
} from '../sdk/account.js'

import config from '../sdk/config.js'
import { Database } from '../database.js'
import { HUMANITY_REGISTRATION_URL } from '../constants.js'
import { getDefaultBrowserSession, saveBrowserSession } from '../sdk/browser.js'

import { EmailClient } from '../sdk/email.js'
import { sleep } from '../sdk/utils.js'


export default class CreateNewProfileModule {
    async run() {
        consola.start('[Profile creator] Started...')

        const emailClient = new EmailClient(config.EMAIL_SERVICE_URL, config.EMAIL_SERVICE_IMAP_HOST, config.EMAIL_SERVICE_IMAP_PORT)
        await emailClient.ping()

        const database = Database.readFromJson()
        const db = Database.getAccountsForNewProfile()

        let index = 1
        for (const account of db.data) {
            const { browser, context } = await getDefaultBrowserSession(
                account.proxy,
                !config.SHOW_BROWSER
            )

            try {
                consola.start(
                    `[Profile creator] [${index}/${db.data.length}]. Working with ${account.address}/${account.email_username}`
                )

                const [token, signature, message, sigExpTime] = await getToken(
                    account.address,
                    account.private_key,
                    account.proxy
                )

                const humanityPage = await context.newPage()

                await humanityPage.goto(HUMANITY_REGISTRATION_URL, {
                    waitUntil: 'domcontentloaded'
                })

                await seedLocalStorage(
                    humanityPage,
                    token,
                    account.address,
                    signature,
                    message
                )
                const result = await solveRegistration(
                    emailClient,
                    { browser, context },
                    humanityPage,
                    account.email_username,
                    account.email_password,
                    account.username,
                    account.referral_name,
                    account.name
                )

                if (result) {
                    database.updateById(account.id, 'reg_state', 'finished')
                    database.saveDatabase()

                    await saveBrowserSession(context, account.id)
                    await sleep(
                        config.REGISTRATION_DELAY_SEC[0],
                        config.REGISTRATION_DELAY_SEC[1]
                    )
                }
            } catch (e) {
                consola.error('[Profile creator] Failed to process account')
                consola.error(e)
            }

            await browser.close()

            index++
        }

        consola.success('[Profile creator] All accounts have been processed')
    }
}
