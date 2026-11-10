# Production deploy

Первый запуск выполняется локально командой `make deploy-bootstrap`. Скрипт
клонирует репозиторий на `prodfront`, создаёт шаблон `.env.prod` и после его
заполнения собирает контейнер.

Frontend слушает только приватный интерфейс `prodfront` на порту 3010. Публичный
адрес `https://acousticcalc.constrtodo.ru` и TLS обслуживаются `gatewaytodo`.

Локальный `deploy/.env.deploy` создаётся из `.env.deploy.example` и не попадает
в Git. На сервере `.env.prod` создаётся из `.env.prod.example` и также не
попадает в Git.

GitHub Actions запускается после push в `main`, проверяет frontend, подключается
к `prodfront` через `gateway-01`, выкладывает точный commit SHA и выполняет
публичный `/__health` smoke-test.

Обязательные GitHub Actions secrets:

- `DEPLOY_SSH_KEY`
- `DEPLOY_KNOWN_HOSTS`
- `DEPLOY_HOST`
- `DEPLOY_JUMP_HOST`
- `DEPLOY_DIR`
- `DEPLOY_DOMAIN`

`TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID` необязательны.
