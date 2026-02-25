IMAGE_NAME = acoustic-calc
PORT = 3000

build:
	docker build -t $(IMAGE_NAME) .

run:
	docker run -d --name $(IMAGE_NAME) -e BASE_URL=$(BASE_URL) -p $(PORT):3000 $(IMAGE_NAME)

stop:
	docker stop $(IMAGE_NAME)

rm:
	docker rm $(IMAGE_NAME)

restart: stop rm run

clean: stop rm
	docker rmi $(IMAGE_NAME)
