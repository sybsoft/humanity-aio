import Captcha from '2captcha'
import config from './config.js'
import axios from 'axios'

export const solveCaptcha = async (
    key = '6LenESAqAAAAAL9ZymIB_A4Y03U3s3cPhBYKfcnU',
    url = 'https://testnet.humanity.org',
    retryCount = 5
) => {
    const solver = new Captcha.Solver(config.TWO_CAPTCHA_KEY)
    try {
        consola.info('Solving captcha...')
        const solution = await solver.recaptcha(key, url, {
            enterprise: 1,
            version: 3,
            min_score: 0.9,
            action: 'LOGIN',
            userAgent: getRandom(),
            apiDomain: 'recaptcha.net'
        })

        consola.success('Solved captcha')

        return solution.data
    } catch (e) {
        if (retryCount < 0) {
            return false
        }
        consola.error('Cant solve captcha. Retrying...')
        return await solveCaptcha(key, url, retryCount - 1)
    }
}

export const capsolver = async () => {
    const api_key = config.CAPSOLVER_KEY
    const payload = {
        clientKey: api_key,
        task: {
            type: 'ReCaptchaV3TaskProxyLess',
            websiteKey: '6LenESAqAAAAAL9ZymIB_A4Y03U3s3cPhBYKfcnU',
            websiteURL: 'https://testnet.humanity.org',
            pageAction: 'LOGIN'
        }
    }

    try {
        const res = await axios.post(
            'https://api.capsolver.com/createTask',
            payload
        )
        const task_id = res.data.taskId
        if (!task_id) {
            console.log('Failed to create task:', res.data)
            return
        }
        // console.log('Got taskId:', task_id)

        while (true) {
            await new Promise((resolve) => setTimeout(resolve, 1000)) // Delay for 1 second

            const getResultPayload = { clientKey: api_key, taskId: task_id }
            const resp = await axios.post(
                'https://api.capsolver.com/getTaskResult',
                getResultPayload
            )
            const status = resp.data.status

            if (status === 'ready') {
                return resp.data.solution.gRecaptchaResponse
            }
            if (status === 'failed' || resp.data.errorId) {
                console.log('Solve failed! response:', resp.data)
                return
            }
        }
    } catch (error) {
        console.error('Error:', error)
    }
}
