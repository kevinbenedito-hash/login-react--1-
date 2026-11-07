# Login React

Página de login em React (Vite) com uma **API local incluída**. Tudo roda com um único comando, direto no VS Code.

## Como rodar no VS Code

1. Abra a pasta do projeto no VS Code (`File > Open Folder`).
2. Abra o terminal (`Ctrl + '`) e rode:

```bash
npm install
npm run dev
```

O `.env` já vem configurado. Ao rodar, sobem dois processos juntos:

- **Site (React):** http://localhost:5173
- **API local:** http://localhost:3001

Também dá para iniciar pelo VS Code: `Ctrl + Shift + B` roda a tarefa "Iniciar projeto (API + site)".

**Login de teste:** `admin@example.com` / `123456`

## Como o login funciona

1. A página envia `POST /api/auth/login` com e-mail e senha.
2. O Vite repassa a chamada para a API local (`http://localhost:3001/auth/login`).
3. A API confere as credenciais e devolve:

```json
{ "access_token": "<JWT>", "token_type": "Bearer", "expires_in": 3600 }
```

4. A página guarda o token e mostra a tela de sucesso, com o token mascarado e botões para mostrar, copiar e sair.

O `access_token` é um JWT (HS256) assinado pela API, válido por 1 hora.

## Testar a API sem o site

Instale a extensão **REST Client** (já recomendada em `.vscode/extensions.json`), abra o arquivo `requests.http` e clique em "Send Request" em cada bloco. O terceiro bloco usa o token para chamar `GET /auth/me`.

## Endpoints da API local

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/auth/login` | Recebe `email` (ou `username`) e `password`. Aceita JSON ou formulário. Devolve o `access_token`. |
| GET | `/auth/me` | Exige `Authorization: Bearer <token>`. Devolve os dados do usuário. |
| GET | `/health` | Verifica se a API está no ar. |

Usuários e segredo ficam em `server/server.js` e no `.env` (`JWT_SECRET`).

## Usar a API real do desafio

Se o desafio fornecer uma API própria, ajuste só o `.env` e reinicie o `npm run dev`:

| Variável | O que faz |
| --- | --- |
| `API_PROXY_TARGET` | Endereço real da API (no lugar de `http://localhost:3001`). |
| `VITE_LOGIN_PATH` | Caminho do endpoint de login, por exemplo `/auth/login`. |
| `VITE_LOGIN_FORMAT` | `json` ou `form` (estilo OAuth2). |
| `VITE_USER_FIELD` | Nome do campo de usuário enviado (`email`, `username`...). |
| `VITE_PASSWORD_FIELD` | Nome do campo de senha enviado. |
| `VITE_USE_MOCK` | `true` para rodar sem nenhuma API (qualquer e-mail válido com a senha `123456`). |

## O que a página faz

- Valida e-mail (ou usuário) e senha antes de chamar a API.
- Mostra erros da API em um alerta e bloqueia o botão durante o envio.
- Aceita respostas com `access_token`, `accessToken` ou `token`, inclusive dentro de `data`.
- "Lembrar de mim" guarda a sessão no `localStorage`; sem ele, usa `sessionStorage`.
- Descarta a sessão quando o token expira (se a API enviar `expires_in`).

## Estrutura

```
server/server.js           API local (login, /auth/me, JWT)
src/
  App.jsx                  alterna entre login e área logada
  components/LoginPage.jsx formulário de login
  components/Dashboard.jsx exibe o access_token recebido
  services/auth.js         chamada à API e leitura da resposta
  services/storage.js      guarda e recupera a sessão
.vscode/                   tarefas, depuração e extensões recomendadas
requests.http              requisições de teste para a API
```

## Observações de segurança

- A senha de demonstração e o `JWT_SECRET` padrão servem só para desenvolvimento. Troque os dois antes de qualquer uso real.
- Guardar o token no navegador é simples, mas fica exposto a scripts maliciosos (XSS). Em produção, o mais seguro é a API entregar o token em um cookie `HttpOnly`.

## Build de produção

```bash
npm run build
npm run preview
```
