import { consola } from 'consola'

import {
    CreateNewProfileModule,
    FaucetModule,
    ClaimRewardsModule,
    StatsReportModule
} from './modules/index.js'

import { MENU_OPTIONS } from './constants.js'
import { Database } from './database.js'
import { printGreetingMessage } from './sdk/utils.js'


const run = async () => {
    const maxPrimaryLength =
        Math.max(...MENU_OPTIONS.map((o) => o.primary.length)) + 1

    const promptOptions = MENU_OPTIONS.map((option) => ({
        label:
            option.primary.padEnd(maxPrimaryLength, ' ') +
            ' ( ' +
            option.description +
            ' ) ',
        value: option.value
    }))

    printGreetingMessage()

    const input = await consola.prompt('Choose a module:', {
        type: 'select',
        options: promptOptions,
        initial: 'TypeScript'
    })

    switch (input) {
        case '1': {
            const shouldCreateDatabase = await consola.prompt(
                'Do you want to create a database?',
                {
                    type: 'confirm'
                }
            )

            if (shouldCreateDatabase) {
                Database.createDatabase()
            }
            break
        }
        case '2': {
            const createProfileModule = new CreateNewProfileModule()
            createProfileModule.run()
            break
        }
        case '3': {
            const faucetModule = new FaucetModule()
            faucetModule.run()
            break
        }
        case '4': {
            const claimRewardsModule = new ClaimRewardsModule()
            claimRewardsModule.run()
            break
        }
        case '7': {
            StatsReportModule.run()
            break
        }

        case '8': {
            Database.seedDatabase()
            break
        }
    }
}

run()
