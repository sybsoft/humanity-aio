# Humanity - https://t.me/sybilych

- Заполняем `data/emails.txt` в формате username:pass
- Заполняем `data/evm_connect_wallets_private_keys.txt`
- Заполняем `proxies.txt` в формате user:pass@host:port
- Заполняем `data/names.txt` в формате firstname:lastname
- Заполняем `data/referral_names.txt`
- Заполняем `data/usernames.txt`

### Настройка

Все настройки в `config.toml`

### Установка зависимостей

В корневой папке вызываем команду `npm i --force`

В папке mail вызываем команды:

- `python -m venv venv`
- `./venv/Scripts/Activate`
- `pip install uvicorn fastapi`

### Запуск

Вызываем команду: `npm start`
В папке mail: `uvicorn main:app --reload  --port 8198`
