import { consola } from 'consola'

import { Database } from '../database.js'
import { sleep } from '../sdk/utils.js'
import config from '../sdk/config.js'
import { claimFaucet } from '../sdk/account.js'

export default class FaucetModule {
    async run() {
        consola.start('[Faucet] Started...')

        const database = Database.readFromJson()
        const db = Database.getFaucetRemaining()

        let index = 1
        for (const account of db.data) {
            consola.start(
                `[Faucet] [${index}/${db.data.length}]. Working with ${account.address}`
            )

            const isClaimed = await claimFaucet(account.address, account.proxy)
            if (isClaimed) {
                const currentTimestamp = Math.floor(Number(new Date()) / 1000)
                database.updateById(
                    account.id,
                    'faucet_claimed_time',
                    currentTimestamp
                )
                database.saveDatabase()
            }
            await sleep(config.FAUCET_SLEEP_SEC[0], config.FAUCET_SLEEP_SEC[1])
            index++
        }

        consola.success('[Faucet] All accounts have been processed')
    }
}
