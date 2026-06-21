IMAGE     ?= acoustic-calc
CNAME     ?= acoustic-calc
HOST_PORT ?= 3003
BASE_URL  ?= https://dev3.constrtodo.ru:3005

.PHONY: build run stop rm restart logs shell clean help

help:                ## Показать список команд
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build:               ## Собрать Docker-образ
	docker build -t $(IMAGE) .

run:                 ## Запустить контейнер (loopback-only, TLS на host nginx)
	docker run -d --name $(CNAME) \
		--restart unless-stopped \
		-p 127.0.0.1:$(HOST_PORT):3000 \
		-e HTTP_PORT=3000 \
		-e BASE_URL=$(BASE_URL) \
		$(IMAGE)

stop:                ## Остановить контейнер
	docker stop $(CNAME)

rm:                  ## Удалить контейнер
	docker rm $(CNAME)

restart: stop rm run ## Перезапустить контейнер

logs:                ## Следить за логами контейнера
	docker logs -f $(CNAME)

shell:               ## Открыть shell внутри контейнера
	docker exec -it $(CNAME) sh

clean: stop rm       ## Остановить, удалить контейнер и образ
	docker rmi $(IMAGE)
