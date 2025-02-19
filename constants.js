export const EMAIL_USERNAMES_FILE_PATH = 'data/emails.txt'
export const EVM_CONNECT_WALLETS_PRIVATE_KEYS_FILE_PATH =
    'data/evm_connect_wallets_private_keys.txt'
export const DATABASE_FILE_PATH = 'data/database.json'
export const TOKENS_FILE_PATH = 'data/tokens.json'
export const REF_NAMES_FILE_PATH = 'data/referral_names.txt'
export const PROXIES_FILE_PATH = 'data/proxies.txt'
export const USERNAMES_FILE_PATH = 'data/usernames.txt'
export const NAMES_FILE_PATH = 'data/names.txt'
export const EXPORT_TOWNS_STATS_FILE_PATH = 'data/export/stats.xlsx'

export const MENU_OPTIONS = [
    {
        primary: 'Create database',
        description: 'Создать базу данных',
        value: '1'
    },
    {
        primary: 'Create new profile',
        description: 'Создать новый профиль',
        value: '2',
        hint: ''
    },
    {
        primary: 'Faucet',
        description: 'Запросить тестовые токены',
        value: '3',
        hint: ''
    },
    { primary: 'Claim rewards', description: 'Забрать награды', value: '4' },
    {
        primary: 'Stats report',
        description: 'Экспорт статистики аккаунтов в Excel',
        value: '7'
    },
    {
        primary: 'Seed database',
        description: 'Обновить базу данных',
        value: '8'
    }
]

export const HUMANITY_REGISTRATION_URL =
    'https://testnet.humanity.org/onboarding'
export const HUMANITY_FAUCET_URL =
    'https://faucet.testnet.humanity.org/api/claim'
export const HUMANITY_AUTH_URL =
    'https://terminal3.humanity.org/api/user/connect'
export const HUMANITY_RPC_URL = 'https://rpc.testnet.humanity.org'
