IMAGE_NAME = acoustic-calc

build:
	cp .dockerignore ../.dockerignore && docker build -t $(IMAGE_NAME) -f Dockerfile .. && rm ../.dockerignore

run:
	docker run --name $(IMAGE_NAME) -p 3003:3000 -p 3446:3443 \
		-e BASE_URL=$(BASE_URL) \
		-d $(IMAGE_NAME)

stop:
	docker stop $(IMAGE_NAME)

rm:
	docker rm $(IMAGE_NAME)

restart: stop rm run

clean: stop rm
	docker rmi $(IMAGE_NAME)
