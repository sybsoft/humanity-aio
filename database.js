import fs from 'fs'
import {
    DATABASE_FILE_PATH,
    EMAIL_USERNAMES_FILE_PATH,
    EVM_CONNECT_WALLETS_PRIVATE_KEYS_FILE_PATH,
    PROXIES_FILE_PATH,
    USERNAMES_FILE_PATH,
    REF_NAMES_FILE_PATH,
    NAMES_FILE_PATH
} from './constants.js'
import { consola } from 'consola'
import Web3 from 'web3'
import { shuffleArray } from './sdk/utils.js'

const web3 = new Web3()


class Account {
    constructor(
        id,
        private_key,
        address,
        proxy,
        reg_state,
        reward_claimed_time,
        faucet_claimed_time,
        email_username,
        email_password,
        username,
        referral_name,
        name
    ) {
        this.id = id
        this.private_key = private_key
        this.address = address
        this.proxy = proxy
        this.reg_state = reg_state
        this.reward_claimed_time = reward_claimed_time
        this.faucet_claimed_time = faucet_claimed_time
        this.email_username = email_username
        this.email_password = email_password
        this.username = username
        this.referral_name = referral_name
        this.name = name
    }
}

export class Database {
    constructor(data = []) {
        this.data = data
    }

    toDict() {
        return this.data.map((dataItem) => ({ ...dataItem }))
    }

    updateById(id, field, value) {
        const wallet = this.data.find((item) => item.id === id)

        if (wallet) {
            wallet[field] = value
        } else {
            consola.error(`[Database] Wallet with id: ${id} not found`)
        }
    }

    saveDatabase(fileName = DATABASE_FILE_PATH) {
        const dbDict = this.toDict()
        fs.writeFileSync(fileName, JSON.stringify(dbDict, null, 4))
        consola.success(`[Database] Saved to ${fileName}`)
    }

    static readFromTxt(filePath) {
        return fs
            .readFileSync(filePath, 'utf-8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean)
    }

    static _readJson(fileName) {
        return JSON.parse(fs.readFileSync(fileName, 'utf-8'))
    }

    static parseAccount(item) {
        return new Account(
            item.id,
            item.private_key,
            item.address,
            item.proxy,
            item.reg_state,
            item.reward_claimed_time,
            item.faucet_claimed_time,
            item.email_username,
            item.email_password,
            item.username,
            item.referral_name,
            item.name
        )
    }

    static createDatabase() {
        const data = []
        const evm_connect_wallet_private_keys = Database.readFromTxt(
            EVM_CONNECT_WALLETS_PRIVATE_KEYS_FILE_PATH
        )

        const proxies = Database.readFromTxt(PROXIES_FILE_PATH)
        const usernames = Database.readFromTxt(USERNAMES_FILE_PATH)
        const referral_names = Database.readFromTxt(REF_NAMES_FILE_PATH)
        const email_rows = Database.readFromTxt(EMAIL_USERNAMES_FILE_PATH)
        const names = Database.readFromTxt(NAMES_FILE_PATH)

        for (const private_key of evm_connect_wallet_private_keys) {
            try {
                const account_index =
                    evm_connect_wallet_private_keys.indexOf(private_key)
                const address =
                    web3.eth.accounts.privateKeyToAccount(private_key).address
                const [email_username, email_password] =
                    email_rows[account_index].split(':')

                const item = new Account(
                    account_index,
                    private_key,
                    address,
                    proxies[account_index],
                    false,
                    0,
                    0,
                    email_username,
                    email_password,
                    usernames[account_index],
                    referral_names[account_index],
                    names[account_index]
                )

                data.push(item)
            } catch (e) {
                consola.error(`[Database] Error: ${e}`)
            }
        }

        consola.success(`[Database] Created successfully`)

        const db = new Database(data)
        db.saveDatabase()

        return db
    }

    static readFromJson(fileName = DATABASE_FILE_PATH) {
        try {
            const dbArray = Database._readJson(fileName)
            const data = dbArray.map(Database.parseAccount)
            return new Database(shuffleArray(data))
        } catch (e) {
            consola.error(`[Database] Error: ${e}`)
            return new Database([])
        }
    }

    static getAccountsForNewProfile(fileName = DATABASE_FILE_PATH) {
        try {
            const dbArray = Database._readJson(fileName)
            const filtered = dbArray.filter(
                (item) => item.reg_state !== 'finished'
            )
            const data = filtered.map(Database.parseAccount)
            return new Database(shuffleArray(data))
        } catch (e) {
            consola.error(`[Database] Error: ${e}`)
            return new Database([])
        }
    }

    static getFaucetRemaining(fileName = DATABASE_FILE_PATH) {
        try {
            const dbArray = Database._readJson(fileName)
            const currentTimestamp = Math.floor(Date.now() / 1000)
            const filtered = dbArray.filter(
                (item) =>
                    item.faucet_claimed_time === 0 ||
                    currentTimestamp - Number(item.faucet_claimed_time) >= 60
            )
            const data = filtered.map(Database.parseAccount)
            return new Database(shuffleArray(data))
        } catch (e) {
            consola.error(`[Database] Error: ${e}`)
            return new Database([])
        }
    }

    static getRewardsRemaining(fileName = DATABASE_FILE_PATH) {
        try {
            const dbArray = Database._readJson(fileName)
            const currentTimestamp = Math.floor(Date.now() / 1000)
            const filtered = dbArray.filter(
                (item) =>
                    (item.reg_state === 'finished' &&
                        item.reward_claimed_time === 0) ||
                    currentTimestamp - Number(item.reward_claimed_time) >=
                        9 * 60 * 60
            )
            const data = filtered.map(Database.parseAccount)
            return new Database(shuffleArray(data))
        } catch (e) {
            consola.error(`[Database] Error: ${e}`)
            return new Database([])
        }
    }

    static updateEmails(fileName = DATABASE_FILE_PATH) {
        try {
            const emails = Database.readFromTxt('data/emails.txt')
            const db = Database.readFromJson()
            for (let i = 0; i < db.data.length; i++) {
                const [email_username, email_password] = emails[i].split(':')

                db.updateById(i, 'email_username', email_username)
                db.updateById(i, 'email_password', email_password)
            }

            db.saveDatabase()
        } catch (e) {
            consola.error(`[Database] Error: ${e}`)
            return new Database([])
        }
    }

    static updateUsernames(fileName = DATABASE_FILE_PATH) {
        try {
            const usernames = Database.readFromTxt('data/usernames.txt')
            const db = Database.readFromJson()
            for (let i = 0; i < db.data.length; i++) {
                const username = usernames[i]

                db.updateById(i, 'username', username)
            }

            db.saveDatabase()
        } catch (e) {
            consola.error(`[Database] Error: ${e}`)
            return new Database([])
        }
    }

    static updateReferralNames(fileName = DATABASE_FILE_PATH) {
        try {
            const referral_names = Database.readFromTxt(
                'data/referral_names.txt'
            )
            const db = Database.readFromJson()
            for (let i = 0; i < db.data.length; i++) {
                const referral_name = referral_names[i]

                db.updateById(i, 'referral_name', referral_name)
            }

            db.saveDatabase()
        } catch (e) {
            consola.error(`[Database] Error: ${e}`)
            return new Database([])
        }
    }

    static updateNames(fileName = DATABASE_FILE_PATH) {
        try {
            const names = Database.readFromTxt('data/names.txt')
            const db = Database.readFromJson()
            for (let i = 0; i < db.data.length; i++) {
                const name = names[i]

                db.updateById(i, 'name', name)
            }

            db.saveDatabase()
        } catch (e) {
            consola.error(`[Database] Error: ${e}`)
            return new Database([])
        }
    }

    static updateProxies(fileName = DATABASE_FILE_PATH) {
        try {
            const proxies = Database.readFromTxt('data/proxies.txt')
            const db = Database.readFromJson()
            for (let i = 0; i < db.data.length; i++) {
                const proxy = proxies[i]

                db.updateById(i, 'proxy', proxy)
            }

            db.saveDatabase()
        } catch (e) {
            consola.error(`[Database] Error: ${e}`)
            return new Database([])
        }
    }

    static seedDatabase(fileName = DATABASE_FILE_PATH) {
        try {
            const db = Database.readFromJson(fileName)
            const data = db.data
            const private_keys = Database.readFromTxt(
                EVM_CONNECT_WALLETS_PRIVATE_KEYS_FILE_PATH
            )

            if (private_keys.length > data.length) {
                consola.info(
                    `[Database.seedDatabase] Appending ${private_keys.length - data.length} new account(s).`
                )

                const originalLength = data.length

                const proxies = Database.readFromTxt(PROXIES_FILE_PATH)
                const usernames = Database.readFromTxt(USERNAMES_FILE_PATH)
                const referral_names = Database.readFromTxt(REF_NAMES_FILE_PATH)
                const email_rows = Database.readFromTxt(
                    EMAIL_USERNAMES_FILE_PATH
                )
                const names = Database.readFromTxt(NAMES_FILE_PATH)

                for (let i = originalLength; i < private_keys.length; i++) {
                    try {
                        const private_key = private_keys[i]
                        const address =
                            web3.eth.accounts.privateKeyToAccount(
                                private_key
                            ).address
                        const [email_username, email_password] =
                            email_rows[i].split(':')
                        const account = new Account(
                            i,
                            private_key,
                            address,
                            proxies[i],
                            false,
                            0,
                            0,
                            email_username,
                            email_password,
                            usernames[i],
                            referral_names[i],
                            names[i]
                        )
                        data.push(account)
                    } catch (innerError) {
                        consola.error(
                            `[Database.seedDatabase] Failed to append account at index ${i}: ${innerError}`
                        )
                    }
                }

                db.saveDatabase()

                Database.updateUsernames()
                Database.updateReferralNames()
                Database.updateNames()
                Database.updateEmails()
                Database.updateProxies()

                consola.success(
                    `[Database.seedDatabase] Appended ${data.length - originalLength} new account(s).`
                )
            } else {
                consola.info(
                    `[Database.seedDatabase] No new private keys to add.`
                )
            }
            return db
        } catch (e) {
            consola.error(`[Database.seedDatabase] Error: ${e}`)
            return new Database([])
        }
    }
}
