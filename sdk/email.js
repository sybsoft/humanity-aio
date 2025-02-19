import { consola } from 'consola'

import { sleep } from './utils.js'
import config from './config.js'


export class EmailClient {
    constructor(host, imap_host, imap_port) {
        this.host = host
        this.imap_host = imap_host
        this.imap_port = imap_port
    }

    async getEmail(email_username, email_password, retries = config.EMAIL_RETRIES) {
        try {
            const emailCode = await fetch(`${this.host}/check_email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email_address: email_username,
                    email_password: email_password,
                    host: this.imap_host,
                    port: this.imap_port,
                })
            })

            const emailCodeJson = await emailCode.json()

            const status = emailCodeJson['status']
            const message = emailCodeJson['message'].toString()

            // consola.info(emailCodeJson)

            if (status !== 'error') {
                consola.success(`Got code: ${message}`)
                return message
            }

            if (retries <= 0) {
                return false
            }

            await sleep(config.EMAIL_SLEEP_IF_NOT_CODE_FOUND_SEC, config.EMAIL_SLEEP_IF_NOT_CODE_FOUND_SEC)

            return await this.getEmail(
                email_username,
                email_password,
                retries - 1
            )
        } catch (e) {
            consola.error('Failed to get email')
            if (retries <= 0) {
                return false
            }

            await sleep(config.EMAIL_SLEEP_IF_NOT_CODE_FOUND_SEC, config.EMAIL_SLEEP_IF_NOT_CODE_FOUND_SEC)

            return await this.getEmail(
                email_username,
                email_password,
                retries - 1
            )
        }
    }

    async clearEmail(email_username, email_password, retries = 10) {
        try {
            const response = await fetch(`${this.host}/clear_email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email_address: email_username,
                    email_password: email_password,
                    host: this.imap_host,
                    port: this.imap_port,
                })
            })

            const data = await response.json()
            if (data.status !== 'success') {
                throw new Error('Failed to clear email')
            }
        } catch (e) {
            consola.error('Failed to clear email')
            if (retries <= 0) {
                return false
            }
        }
    }

    async ping() {
        try {
        const response = await fetch(`${this.host}/ping`)
        const data = await response.json()
        if (data.status !== 'success') {
                consola.error('Email service is not responding. Start it.')
                process.exit(1)
            }
        } catch (e) {
            consola.error('Email service is not responding. Start it.')
            process.exit(1)
        }
    }
}
