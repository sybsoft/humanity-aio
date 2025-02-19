import Web3 from 'web3'
import consola from 'consola'

import { Database } from '../database.js'
import { HUMANITY_RPC_URL } from '../constants.js'

export const getNativeBalance = async (wallet_address) => {
    const web3 = new Web3(HUMANITY_RPC_URL)
    const balanceWei = await web3.eth.getBalance(wallet_address)

    const balanceEth = web3.utils.fromWei(balanceWei, 'ether')

    return balanceEth
}

export default class ClaimRewardsModule {
    async run() {
        consola.info('[Claim rewards] Started...')
        const contractAbi = `[
            {
                "inputs": [],
                "name": "claimReward",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]`

        const database = Database.readFromJson()
        const db = Database.getRewardsRemaining()
        const data = db.data

        let index = 1
        for (const userAccount of data) {
            try {
                consola.start(
                    `[Claim rewards] [${index}/${data.length}]. Working with ${userAccount.address}`
                )

                const web3 = new Web3(HUMANITY_RPC_URL)

                const account = web3.eth.accounts.privateKeyToAccount(
                    userAccount.private_key
                )
                web3.eth.accounts.wallet.add(account)
                web3.eth.defaultAccount = account.address

                const abi = JSON.parse(contractAbi)
                const contract = new web3.eth.Contract(
                    abi,
                    '0xa18f6FCB2Fd4884436d10610E69DB7BFa1bFe8C7'
                )

                const result = await contract.methods.claimReward().send({
                    from: web3.utils.toChecksumAddress(account.address),
                    gas: 3000000,
                    gasPrice: '0'
                })

                consola.success(
                    `[Claim rewards] Claimed reward for ${userAccount.address}`
                )

                const currentTimestamp = Math.floor(Number(new Date()) / 1000)
                database.updateById(
                    userAccount.id,
                    'reward_claimed_time',
                    currentTimestamp
                )
                database.saveDatabase()
            } catch (e) {
                consola.error(
                    `[Claim rewards] Failed to claim rewards for ${userAccount.address}. Skipping...`
                )
            }

            index++
        }
    }
}
