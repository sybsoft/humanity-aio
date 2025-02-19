import { consola } from 'consola'
import XLSX from 'xlsx'

import { Database } from '../database.js'
import { EXPORT_TOWNS_STATS_FILE_PATH } from '../constants.js'


export default class StatsReportModule {
    static async exportJson(
        data,
        destination,
        headers,
        workbook,
        sheet = 'Sheet1'
    ) {
        try {
            const worksheetData = headers

            for (const [key, value] of Object.entries(data)) {
                worksheetData.push([key, ...value])
            }

            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
            XLSX.utils.book_append_sheet(workbook, worksheet, sheet)
        } catch (error) {
            console.error(
                `Encountered an error while exporting db to Excel: ${error.message}`
            )
            process.exit(1)
        }
    }

    static async getAccountReport(account) {
        return [
            account.reward_claimed_time != 0 ? 'Yes' : 'No',
            account.faucet_claimed_time != 0 ? 'Yes' : 'No',
            account.reg_state == 'finished' ? 'Yes' : 'No'
        ]
    }

    static async run() {
        consola.info('Running stats report module')

        const db = Database.readFromJson()

        let index = 1
        let r = {}

        const workbook = XLSX.utils.book_new()

        for (let i = 0; i < db.data.length; i++) {
            const account = db.data.find((x) => x.id == i)

            try {
                const result = await StatsReportModule.getAccountReport(account)

                r[account.address] = result
            } catch (e) {
                consola.error('Failed to process account... Skipping')
                consola.error(e)
            }

            index++
        }
        let headers = [
            'Address',
            'Reward claimed',
            'Faucet claimed',
            'Registered'
        ]

        await StatsReportModule.exportJson(
            r,
            EXPORT_TOWNS_STATS_FILE_PATH,
            [headers],
            workbook,
            'Stats'
        )

        // Get all unregistered wallets
        r = {}
        index = 1
        for (let i = 0; i < db.data.length; i++) {
            const account = db.data.find((x) => x.id == i)

            try {
                if (account.reg_state != 'finished') {
                    r[account.address] = ['yes']
                }
            } catch (e) {
                consola.error('Failed to process account... Skipping')
                consola.error(e)
            }

            index++
        }
        headers = ['Address', 'Unregistered']
        await StatsReportModule.exportJson(
            r,
            EXPORT_TOWNS_STATS_FILE_PATH,
            [headers],
            workbook,
            'Unregistered'
        )

        // Get all faucet not called wallets
        r = {}
        index = 1
        for (let i = 0; i < db.data.length; i++) {
            const account = db.data.find((x) => x.id == i)

            try {
                if (account.faucet_claimed_time == 0) {
                    r[account.address] = ['yes']
                }
            } catch (e) {
                consola.error('Failed to process account... Skipping')
                consola.error(e)
            }

            index++
        }
        headers = ['Address', 'Faucet not called']
        await StatsReportModule.exportJson(
            r,
            EXPORT_TOWNS_STATS_FILE_PATH,
            [headers],
            workbook,
            'Faucet not called'
        )

        // Get all claim rewards not called wallets
        r = {}
        index = 1
        for (let i = 0; i < db.data.length; i++) {
            const account = db.data.find((x) => x.id == i)

            try {
                if (account.faucet_claimed_time == 0) {
                    r[account.address] = ['yes']
                }
            } catch (e) {
                consola.error('Failed to process account... Skipping')
                consola.error(e)
            }

            index++
        }
        headers = ['Address', 'Claim rewards not called']
        await StatsReportModule.exportJson(
            r,
            EXPORT_TOWNS_STATS_FILE_PATH,
            [headers],
            workbook,
            'Claim rewards not called'
        )

        XLSX.writeFile(workbook, EXPORT_TOWNS_STATS_FILE_PATH)
        consola.success(`Exported stats to ${EXPORT_TOWNS_STATS_FILE_PATH}`)
    }
}
