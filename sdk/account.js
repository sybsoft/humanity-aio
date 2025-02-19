import fetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent'

import Web3 from 'web3'
import { consola } from 'consola'

import { HUMANITY_AUTH_URL, HUMANITY_FAUCET_URL } from '../constants.js'

import config from './config.js'

import { generateNonce, sleep } from './utils.js'

import { capsolver } from './captcha.js'
import randomUa from 'random-useragent'


const web3 = new Web3()

export const seedLocalStorage = async (
    humanityPage,
    token,
    walletAddress,
    signature,
    signedMessage
) => {
    consola.start('Seeding local storage')
    await humanityPage.evaluate(
        ({ token, walletAddress }) => {
            localStorage.setItem(
                'humanity:token-store',
                JSON.stringify({
                    state: {
                        token: token,
                        email: '',
                        wallet: walletAddress,
                        connectMethod: 'wallet',
                        referrer: ''
                    },
                    version: 0
                })
            )
        },
        { token, walletAddress }
    )

    await humanityPage.evaluate(
        ({ signedMessage, walletAddress, signature }) => {
            localStorage.setItem(
                'lit-auth-signature',
                JSON.stringify({
                    sig: signature,
                    derivedVia: 'web3.eth.personal.sign',
                    signedMessage: signedMessage,
                    address: walletAddress
                })
            )
        },
        { signedMessage, walletAddress, signature }
    )

    await humanityPage.evaluate(
        ({ walletAddress }) => {
            localStorage.setItem(
                'wagmi.store',
                JSON.stringify({
                    state: {
                        data: {
                            account: walletAddress,
                            chain: {
                                id: 1942999413,
                                unsupported: false
                            }
                        },
                        chains: [
                            {
                                id: 1942999413,
                                name: 'Humanity',
                                network: 'humanity',
                                rpcUrls: {
                                    default: {
                                        http: [
                                            'https://rpc.testnet.humanity.org'
                                        ]
                                    },
                                    public: {
                                        http: [
                                            'https://rpc.testnet.humanity.org'
                                        ]
                                    }
                                },
                                blockExplorers: {
                                    default: {
                                        name: 'Humanity Explorer',
                                        url: 'https://explorer.testnet.humanity.org'
                                    }
                                },
                                nativeCurrency: {
                                    name: 'Testnet HP',
                                    symbol: 'tHP',
                                    decimals: 18
                                }
                            }
                        ]
                    },
                    version: 2
                })
            )
        },
        { walletAddress }
    )

    consola.success('Seeded localstorage')
}

export const solveRegistration = async (
    emailClient,
    browserData,
    humanityPage,
    email_username,
    email_password,
    username,
    referral_name,
    name
) => {
    const [firstName, lastName] = name.split(':')

    await emailClient.clearEmail(
        email_username,
        email_password
    )

    await fillFirstStep(humanityPage, username, referral_name)
    await fillSecondStep(humanityPage, firstName, lastName, email_username)

    await fillEmail(humanityPage, email_username, email_password, emailClient)

    await humanityPage.waitForSelector('text=Welcome to Humanity Protocol', {
        timeout: 1000 * 60 * 5
    })

    return true
}

export const fillFirstStep = async (humanityPage, username, human_id) => {
    await humanityPage.getByPlaceholder('satoshi').fill(username)

    await humanityPage.getByPlaceholder('S3F4G3D').fill(human_id)

    await humanityPage.getByRole('button', { name: 'NEXT' }).click()
}

export const fillSecondStep = async (
    humanityPage,
    firstName,
    lastName,
    email
) => {
    await humanityPage.fill('input[name="profile.first_name"]', firstName)
    await humanityPage.fill('input[name="profile.last_name"]', lastName)
    await humanityPage.fill('input[name="profile.email_address"]', email)
    await humanityPage.fill('input[name="profile.confirm_email"]', email)

    await humanityPage.getByRole('button', { name: 'NEXT' }).click()
}

export const fillEmail = async (page, email_username, email_password, emailClient) => {
    consola.start('Waiting for email input')
    await page.waitForSelector('text=Not in inbox or spam folder?', {
        timeout: 20 * 60 * 1000
    })

    consola.start('Fetching email code...')

    const email_code = await emailClient.getEmail(
        email_username,
        email_password
    )

    await page.keyboard.type(email_code)
}

export const claimFaucet = async (walletAddress, proxy) => {
    try {
        const agent = new HttpsProxyAgent(`http://${proxy}`)

        consola.start('Attempting to claim faucet')

        const r = await fetch(HUMANITY_FAUCET_URL, {
            headers: {
                accept: '*/*',
                'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                'pragma': 'no-cache',
                'priority': 'u=1, i',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'Referer': 'https://faucet.testnet.humanity.org/',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'User-Agent': randomUa.getRandom()
            },
            body: JSON.stringify({
                address: walletAddress
            }),
            agent,
            method: 'POST'
        })

        const rj = await r.json()
        consola.info(rj['msg'])
        consola.success('Claimed tokens')
        return true
    } catch (e) {
        consola.error('Failed to claim faucet')
        return false
    }
}

export const signMsg = async (walletAddress, walletPrivateKey, nonce) => {
    const privateKey = walletPrivateKey
    const currentTime = new Date()
    const currentTimeIsoString = currentTime.toISOString()
    const expTime = new Date(new Date().setHours(currentTime.getHours() + 1))
    const expTimeIsoString = expTime.toISOString()

    const message = `testnet.humanity.org wants you to sign in with your Ethereum account:\n${walletAddress}\n\n\nURI: https://testnet.humanity.org\nVersion: 1\nChain ID: 137\nNonce: ${nonce}\nIssued At: ${currentTimeIsoString}\nExpiration Time: ${expTimeIsoString}`
    const signedMessage = web3.eth.accounts.sign(message, privateKey)

    return [
        signedMessage.signature,
        message,
        currentTimeIsoString,
        expTimeIsoString
    ]
}

export const getToken = async (address, private_key, proxy) => {
    const nonce = generateNonce()

    const [signature, message, sigIssuedTime, sigExpTime] = await signMsg(
        web3.utils.toChecksumAddress(address),
        private_key,
        nonce
    )

    const recaptchaToken = await capsolver()

    const agent = new HttpsProxyAgent(`http://${proxy}`)

    consola.start('Trying to obtain auth token')

    const response = await fetch(HUMANITY_AUTH_URL, {
        body: JSON.stringify({
            message: `{\"domain\":\"testnet.humanity.org\",\"address\":\"${web3.utils.toChecksumAddress(address)}\",\"statement\":\"\",\"uri\":\"https://testnet.humanity.org\",\"version\":\"1\",\"expirationTime\":\"${sigExpTime}\",\"chainId\":137,\"nonce\":\"${nonce}\",\"issuedAt\":\"${sigIssuedTime}\"}`,
            signature: signature,
            wallet: address,
            chain_id: '137',
            attributed_client_id: 1,
            method: 'wallet',
            recaptcha_token: recaptchaToken
        }),
        agent,
        method: 'POST',
        headers: {
            'accept': '*/*',
            'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'access-control-allow-origin': 'https://terminal3.humanity.org/api',
            'baggage':
                'sentry-environment=production,sentry-release=2f1e47a5d191f36e9d73610e73b2a2d54a9360fc,sentry-public_key=86fce1cd052a81898cbbe23220309905,sentry-trace_id=6c465fd89feb48caaaec67b02210e63a,sentry-sample_rate=0.1,sentry-sampled=false',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'pragma': 'no-cache',
            'priority': 'u=1, i',
            'sec-ch-ua':
                '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'Referer': 'https://testnet.humanity.org/',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'User-Agent': randomUa.getRandom()
        }
    })

    const rj = await response.json()

    if ('errors' in rj) {
        console.log(rj)
        consola.warn('Captcha is locked')
        await sleep(
            config.CAPTCHA_ERROR_SLEEP_SEC[0],
            config.CAPTCHA_ERROR_SLEEP_SEC[1]
        )
        return await getToken(address, private_key)
    }

    const token = rj['data']['token']
    consola.success('Got auth token')

    return [token, signature, message, sigExpTime]
}
