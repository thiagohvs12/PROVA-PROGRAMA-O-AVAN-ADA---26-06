# Prova Programacao Avancada

Sistema com autenticacao JWT, CORS liberado, documentacao de endpoints, criacao/consulta de usuarios e arquitetura por microsservicos.

## Microsservicos

| Servico | Porta | Responsabilidade |
| --- | --- | --- |
| Auth Service | 3001 | Login e validacao de token |
| User Service | 3002 | Criacao, listagem e consulta de usuarios |

## Como executar

Instale as dependencias:

```bash
npm run install:all
npm install
```

Inicie os dois servicos:

```bash
npm start
```

Tambem pode rodar com Docker:

```bash
docker compose up --build
```

## Usuario inicial

```json
{ "email": "admin@email.com", "password": "123456" }
```

## Documentacao Swagger

- Auth Service: http://localhost:3001/docs
- User Service: http://localhost:3002/docs

## Endpoints

### Auth Service

- `GET /health`: verifica se o servico esta online.
- `POST /auth/login`: realiza login e retorna token JWT.
- `GET /auth/validate`: valida token JWT enviado no cabecalho `Authorization: Bearer token`.

### User Service

- `GET /health`: verifica se o servico esta online.
- `POST /users`: cria usuario.
- `GET /users`: lista usuarios cadastrados. Exige token JWT.
- `GET /users/:id`: consulta usuario por ID. Exige token JWT.
- `GET /internal/users/email/:email`: endpoint interno usado pelo Auth Service.

## Exemplos

Criar usuario:

```bash
curl -X POST http://localhost:3002/users ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Thiago\",\"email\":\"thiago@email.com\",\"password\":\"123456\",\"role\":\"student\"}"
```

Fazer login:

```bash
curl -X POST http://localhost:3001/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"thiago@email.com\",\"password\":\"123456\"}"
```

Listar usuarios:

```bash
curl http://localhost:3002/users ^
  -H "Authorization: Bearer SEU_TOKEN"
```
