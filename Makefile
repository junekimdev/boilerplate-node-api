.PHONY: all build update up down clean

all: build

GIT_URL=https://github.com/YOUR-REPO/YOUR-API.git
NAME=YOUR-API
TAG=1.0-alpine

build:
	docker build \
	--build-arg GIT_HASH=$(shell git ls-remote --heads $(GIT_URL) | cut -c 1-40) \
	-t YOUR-REPO/$(NAME):$(TAG) .

# This updates local repo
update:
	@[ -d .git ] \
	&& git fetch --all && git reset --hard origin/master \
	|| echo "Git repo does not exist. Clone it first."

up:
	@docker-compose up -d \
	&& sleep 5 \
	&& docker logs -t --tail 5 $(NAME)

down:
	docker-compose down

clean:
	docker rmi $(shell docker images -qf dangling=true)
