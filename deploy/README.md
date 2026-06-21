# Деплой acoustic-calc

Пайплайн: push в `main` → GitHub Actions по SSH заходит на сервер → `git pull` →
`docker build` → перезапуск контейнера → health-check `/__health` (5×3 c) →
при провале авто-откат на `:prev`. Уведомления — в Telegram (старт/успех/провал).

TLS терминирует **host nginx** на 443 (wildcard `*.constrtodo.ru`), контейнер
слушает HTTP только на `127.0.0.1:3003`. Поэтому адрес —
`https://acousticcalc.constrtodo.ru/` **без порта**.

## 1. Секреты CI

GitHub → **Settings → Secrets and variables → Actions → New repository secret**:

| Имя | Что |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Токен бота от @BotFather (`/mybots → API Token`). |
| `TELEGRAM_CHAT_ID` | Чат/группа/канал для уведомлений. Для групп/каналов ID со знаком `-`. |
| `DEPLOY_HOST` | Хост сервера (DNS-имя или IP). Только хост — без `user@`, без `ssh://`, без порта. |
| `DEPLOY_USER` | SSH-юзер (напр. `deploy`). Должен уметь `sudo docker ...` без пароля. |
| `DEPLOY_SSH_KEY` | **Приватный** SSH-ключ целиком (`-----BEGIN ... PRIVATE KEY-----` … `END`). Без пассфразы. |
| `DEPLOY_PATH` | Путь к рабочей копии репы на сервере (напр. `/home/deploy/acoustic-calc`). |
| `BASE_URL` | URL бэкенда, куда server.js проксирует `/api`. Сейчас `https://dev3.constrtodo.ru:3005`. |
| `HOST_PORT` | (опц., дефолт `3003`) host-порт контейнера. |
| `DEPLOY_DOMAIN` | (опц.) домен для ссылки в success-сообщении: `acousticcalc.constrtodo.ru`. |

## 2. Bootstrap на сервере (один раз)

```bash
# 1. SSH-юзер с docker-правами (если ещё нет)
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy
echo 'deploy ALL=(ALL) NOPASSWD: /usr/bin/docker' | sudo tee /etc/sudoers.d/deploy-docker
sudo chmod 440 /etc/sudoers.d/deploy-docker

# 2. Положить публичный ключ деплой-юзера
sudo mkdir -p /home/deploy/.ssh
sudo nano /home/deploy/.ssh/authorized_keys     # вставить ssh-ed25519 ... (ПУБличный ключ)
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# 3. (опц.) первый клон — иначе workflow склонирует сам
su - deploy
git clone https://github.com/lvp0110/acoustic_calc.git /home/deploy/acoustic-calc

# 4. nginx (домен acousticcalc.constrtodo.ru)
#    Сначала сверь путь к wildcard-серту с соседним проектом:
sudo nginx -T | grep ssl_certificate
#    при необходимости поправь ssl_certificate* в конфиге, затем:
sudo cp /home/deploy/acoustic-calc/deploy/nginx/acoustic-calc.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/acoustic-calc.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

> DNS: A-запись `acousticcalc.constrtodo.ru` должна указывать на сервер.
> Wildcard `*.constrtodo.ru` уже покрывает этот поддомен — отдельный certbot не нужен.

## 3. Sanity-check (с ноутбука, до пуша)

```bash
# 1. DNS резолвится
dig +short acousticcalc.constrtodo.ru @8.8.8.8

# 2. SSH работает
ssh -i ~/.ssh/<key> deploy@<DEPLOY_HOST> "echo OK"

# 3. sudo docker без пароля
ssh -i ~/.ssh/<key> deploy@<DEPLOY_HOST> "sudo -n docker ps"

# 4. бэкенд доступен с сервера
ssh -i ~/.ssh/<key> deploy@<DEPLOY_HOST> "curl -sv https://dev3.constrtodo.ru:3005/ | head"

# 5. nginx видит конфиг
ssh -i ~/.ssh/<key> deploy@<DEPLOY_HOST> "sudo nginx -T 2>/dev/null | grep -A2 'server_name acousticcalc.constrtodo.ru'"
```

После `git push` в `main` — следи за прогрессом в Telegram и во вкладке Actions.
Когда деплой пройдёт, открой `https://acousticcalc.constrtodo.ru/` — уже без `:3446`.

## Частые грабли

- `DEPLOY_SSH_KEY` — это **приватный** ключ, не публичный. Самая частая ошибка.
- `DEPLOY_HOST` — только хост, без `user@`, без `:port`.
- `TELEGRAM_CHAT_ID` для групп/каналов начинается с `-` — копируй со знаком.
- Ключ генерь без пассфразы: `ssh-keygen -t ed25519 -N "" -f deploy_key`.
- Старый `:3446` (HTTPS внутри контейнера) больше не используется — после переключения
  на host nginx порт можно закрыть в фаерволе.
