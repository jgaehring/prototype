.DEFAULT_GOAL := help
.PHONY: docker-build docker-up build start log stop restart

# V1 command: docker-compose (WITH '-' hyphen)
DOCKER_COMPOSE_CMD_V1=docker-compose
# V2 command: docker compose (WITHOUT '-' hyphen)
DOCKER_COMPOSE_CMD_V2=docker compose

# Default to the v1 command, but then check for `docker compose` and confirm its
# major version number; if it is v2, use that in place of v1. These two commands
# SHOULD be interchangeable, but there seem to be incompatibilities between the
# configuration supported by older versions of docker-compose and newer versions
# of docker (or maybe docker images?). For example, using docker-compose 1.26.0
# with docker 27.5.0 causes a fatal error with the msg:
#
#   ERROR: The Compose file './docker-compose-dev.yml' is invalid because:
#   services.dfc-middleware.depends_on contains an invalid type, it should be an array
#
# Using `docker compose` (2.32.4) seems to resolve the error. Other warnings are
# still present but the containers build successfully.
DOCKER_COMPOSE_CMD=$(DOCKER_COMPOSE_CMD_V1)
# Grab the full semver (eg, 2.0.0) then just the major version (eg, 2).
DOCKER_COMPOSE_V_CHECK:=docker compose version \
	| grep -oE "[0-9]+\.[0-9]+\.[0-9]+" \
	| grep -oE "^[1-9]"
DOCKER_COMPOSE_V:=$(shell $(DOCKER_COMPOSE_V_CHECK))
ifeq (2,$(DOCKER_COMPOSE_V))
DOCKER_COMPOSE_CMD=$(DOCKER_COMPOSE_CMD_V2)
endif

DOCKER_COMPOSE=$(DOCKER_COMPOSE_CMD) -f docker-compose.yml
DOCKER_COMPOSE_PROD=$(DOCKER_COMPOSE_CMD) -f docker-compose-prod.yml
DOCKER_COMPOSE_DEV=$(DOCKER_COMPOSE_CMD) -f docker-compose-dev.yml

# Docker
docker-build:
	$(DOCKER_COMPOSE) build

docker-build-prod:
	$(DOCKER_COMPOSE_PROD) build


docker-up:
	$(DOCKER_COMPOSE) up -d --remove-orphans mongo

docker-stop:
	$(DOCKER_COMPOSE) down

docker-stop-prod:
	$(DOCKER_COMPOSE_PROD) down

docker-stop-dev:
	$(DOCKER_COMPOSE_DEV) down

docker-clean:
	$(DOCKER_COMPOSE) kill
	$(DOCKER_COMPOSE) rm -fv

docker-start:
	$(DOCKER_COMPOSE) up -d --force-recreate

docker-start-prod:
	$(DOCKER_COMPOSE_PROD) up -d --force-recreate

docker-start-dev:
	$(DOCKER_COMPOSE_DEV) up -d --force-recreate

docker-restart:
	$(DOCKER_COMPOSE) up -d --force-recreate

log:
	$(DOCKER_COMPOSE) logs -f dfc-app

# Start
start:
	make docker-start
start-prod: docker-start-prod
start-dev:
	make docker-start-dev

stop: docker-stop
stop-prod: docker-stop-prod
stop-dev: docker-stop-dev

restart: docker-restart

build: docker-build
build-prod: docker-build-prod
