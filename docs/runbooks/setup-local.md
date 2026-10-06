# Execução local

## Pré-requisitos

- Docker com Docker Compose;
- Node.js 24 LTS e npm 10 ou superior para execução fora dos containers.

## Inicialização

1. Copie somente os valores necessários dos arquivos de exemplo para arquivos
   .env locais. Não versione credenciais.
2. Execute: docker compose -f docker-compose.dev.yml up -d --build
3. Aplique as migrations:
   docker compose -f docker-compose.dev.yml exec backend npm run prisma:migrate:deploy
4. Execute a seed:
   docker compose -f docker-compose.dev.yml exec backend npm run prisma:seed

O bootstrap administrativo é opcional e só ocorre quando
BOOTSTRAP_ADMIN_EMAIL contém um endereço dos domínios corporativos permitidos.
A seed sempre mantém idempotentes as permissões e o papel ADMIN.

## Endpoints de diagnóstico

- frontend: http://localhost:5173
- backend: http://localhost:3000/health
- banco: http://localhost:3000/health/db
- início do login Microsoft: http://localhost:3000/api/v1/auth/login (retorna `503` enquanto as credenciais não estiverem configuradas)
- sessão atual autenticada: http://localhost:3000/api/v1/auth/me

As credenciais da App Registration Microsoft permanecem pendentes. Sem elas,
somente a tentativa de login retorna indisponibilidade; os healthchecks iniciam
normalmente.

## Produção

O Compose de produção é uma estrutura portável. Antes do go-live ainda devem ser
definidos host/orquestrador, DNS, proxy HTTPS, estratégia de secrets, provider
S3-compatible (ou volume privado aprovado) e responsáveis por backup e restore.
Migrations são executadas de forma controlada e não durante o startup.
