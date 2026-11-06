include .env

MAKEFLAGS += --no-print-directory

COMPOSE := docker compose -f docker-compose.${APP_ENV}.yml
CONTAINER_NAME := code-grimoire

build:
	@$(COMPOSE) build --no-cache

build-cache:
	@$(COMPOSE) build

# Só no local (bind mount): em produção o site é compilado dentro da imagem (Dockerfile.deploy).
install-deps:
ifeq ($(APP_ENV),local)
	@$(COMPOSE) run --rm --no-deps $(CONTAINER_NAME) npm install
else
	@echo "APP_ENV=$(APP_ENV): o site é compilado dentro da imagem, nada a fazer."
endif

logs:
	@docker logs -f $(CONTAINER_NAME)

watch:
	@$(COMPOSE) up

up:
	@$(COMPOSE) up -d

down:
	@$(COMPOSE) down

restart:
	@make down
	@make up

# Produção: gera o site de novo (conteúdo novo) e troca o container, sem derrubar o resto.
update-build:
	@$(COMPOSE) build $(CONTAINER_NAME)
	@$(COMPOSE) up -d --no-deps $(CONTAINER_NAME)

c :=
exec:
	@$(COMPOSE) exec $(CONTAINER_NAME) $(c)

shell:
	@$(COMPOSE) exec -it $(CONTAINER_NAME) /bin/sh

s :=
t :=
m :=
step:
	@echo
	@echo "█▓▒░ \033[38;2;255;196;12m[$(s)/$(t)]\033[0m $(m)"
	@echo

install:
	@make step s=1 t=3 m="Building the Docker image..."
	@make build
	@make step s=2 t=3 m="Installing dependencies (npm install)..."
	@make install-deps
	@make step s=3 t=3 m="Starting the containers..."
	@make up
	@echo
ifeq ($(APP_ENV),local)
	@echo "░▒▓█ \033[38;2;22;198;12mGrimório de código\033[0m running at http://localhost:$(APP_PORT)"
else
	@echo "░▒▓█ \033[38;2;22;198;12mGrimório de código\033[0m running (APP_ENV=$(APP_ENV)) — aponte o Proxy Host do NPM para code-grimoire:3000"
endif
	@echo
