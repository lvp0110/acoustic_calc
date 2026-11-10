#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/_lib.sh"

REV="${REV:-$DEPLOY_REV}"
info "rollout acoustic-calc на $DEPLOY_HOST: rev=$REV"

remote "git fetch '$DEPLOY_REMOTE' && git checkout --detach '$REV'"

info "сохраняем предыдущий image для rollback"
remote "docker image inspect acoustic-calc:latest >/dev/null 2>&1 && docker tag acoustic-calc:latest acoustic-calc:prev || true"

info "собираем новый frontend image"
compose "build web"

info "перезапускаем frontend"
compose "up -d --no-deps --force-recreate web"

info "ждём container health"
healthy=0
for attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
  status="$(remote "docker inspect --format='{{.State.Health.Status}}' acoustic-calc 2>/dev/null || true")"
  if [ "$status" = "healthy" ]; then
    healthy=1
    break
  fi
  echo "  попытка $attempt/12: ${status:-container unavailable}"
  sleep 5
done

if [ "$healthy" -ne 1 ]; then
  warn "health-check не прошёл; возвращаем предыдущий image"
  compose "logs --tail=100 web" || true
  if remote "docker image inspect acoustic-calc:prev >/dev/null 2>&1"; then
    remote "docker tag acoustic-calc:prev acoustic-calc:latest"
    compose "up -d --no-deps --force-recreate --no-build web"
    fail "новый frontend не прошёл health-check; выполнен rollback"
  fi
  fail "новый frontend не прошёл health-check; предыдущий image отсутствует"
fi

compose "ps web"
ok "acoustic-calc выкачен"
