<p align="center">
  <img src="https://i.pinimg.com/736x/6d/34/8d/6d348d6def078d46ee0edb55687f6ae6.jpg" alt="Sintect Shared Banner" width="250"/>
</p>


<h1 align="center">Sintec-API</h1>

<p align="center">API robusta e escalável para gerenciamento de conteúdo.</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT">
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary">
</p>

## 📜 Visão Geral

A Sintac-Shared-API é uma API RESTful completa, desenvolvida com NestJS, que oferece uma base sólida para a construção de aplicações web modernas e ricas em recursos. Ela fornece um sistema de gerenciamento de conteúdo com funcionalidades de autenticação, gerenciamento de usuários, posts, categorias, tags e comentários.

## ✨ Recursos

- **Autenticação e Autorização:** Sistema completo de autenticação baseado em JWT, com registro, login, logout, atualização de tokens e recuperação de senha.
- **Gerenciamento de Usuários:** Operações CRUD para usuários, com perfis e informações detalhadas.
- **Gerenciamento de Posts:** Criação, leitura, atualização e exclusão de posts, com suporte a imagens de capa e sistema de favoritos.
- **Organização de Conteúdo:** Gerenciamento de categorias e tags para organizar e classificar os posts.
- **Sistema de Comentários:** Funcionalidade de comentários nos posts para interação dos usuários.
- **Upload de Imagens:** Integração com o Cloudinary para upload e armazenamento de imagens.
- **Banco de Dados com Prisma:** Utilização do Prisma ORM para uma interação segura e tipada com o banco de dados PostgreSQL.
- **Validação de Dados:** Validação de entrada de dados com `class-validator` e `class-transformer`.
- **Envio de E-mails:** Integração com o Resend para envio de e-mails transacionais.

## 📂 Estrutura do Projeto

```
/
├── prisma/
│   └── schema.prisma       # Esquema do banco de dados
├── src/
│   ├── auth/               # Autenticação (login, registro, etc.)
│   ├── user/               # Gerenciamento de usuários
│   ├── post/               # Gerenciamento de posts
│   ├── category/           # Gerenciamento de categorias
│   ├── tag/                # Gerenciamento de tags
│   ├── comment/            # Gerenciamento de comentários
│   ├── cloudnary/          # Serviço de upload de imagens
│   ├── prisma/             # Serviço do Prisma
│   ├── resend/             # Serviço de envio de e-mails
│   ├── guards/             # Guards de autenticação
│   ├── strategies/         # Estratégias de autenticação
│   ├── decorator/          # Decorators personalizados
│   └── main.ts             # Arquivo de entrada da aplicação
├── .env.example            # Exemplo de arquivo de variáveis de ambiente
└── package.json            # Dependências e scripts do projeto
```

## ⚙️ Variáveis de Ambiente

Para executar este projeto, você precisará criar um arquivo `.env` na raiz do diretório e adicionar as seguintes variáveis de ambiente:

```bash
# .env

# Aplicação
PORT=3000

# Banco de Dados
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# JWT
JWT_SECRET_KEY="your-secret-key"
JWT_REFRESH_SECRET_KEY="your-refresh-secret-key"

# Resend
API_KEY="your-api-key"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

## 🚀 Instalação e Execução

```bash
# 1. Clone o repositório
$ git clone https://github.com/seu-usuario/zaun-api.git

# 2. Navegue até o diretório do projeto
$ cd zaun-api

# 3. Instale as dependências
$ npm install

# 4. Execute as migrações do Prisma
$ npx prisma migrate dev

# 5. Inicie a aplicação
$ npm run start:dev
```

## 📜 Scripts Disponíveis

| Script          | Descrição                               |
| --------------- | --------------------------------------- |
| `build`         | Compila o código TypeScript.            |
| `format`        | Formata o código com o Prettier.        |
| `start`         | Inicia a aplicação em modo de produção. |
| `start:dev`     | Inicia a aplicação em modo de desenvolvimento com watch. |
| `start:debug`   | Inicia a aplicação em modo de depuração. |
| `lint`          | Executa o linter ESLint.                |
| `test`          | Executa os testes unitários.            |
| `test:watch`    | Executa os testes unitários em modo watch. |
| `test:cov`      | Gera um relatório de cobertura de testes. |
| `test:e2e`      | Executa os testes end-to-end.           |
| `prisma:migrate`| Executa as migrações do banco de dados. |
| `prisma:studio` | Abre o Prisma Studio.                   |

##  API Endpoints

### Autenticação

| Método | Rota                    | Descrição                                     |
| ------ | ----------------------- | --------------------------------------------- |
| `POST` | `/auth/signup`          | Registra um novo usuário.                     |
| `POST` | `/auth/signin`          | Autentica um usuário e retorna tokens.        |
| `POST` | `/auth/signout`         | Invalida o refresh token do usuário.          |
| `POST` | `/auth/refresh`         | Atualiza os tokens de acesso e de atualização.|
| `POST` | `/auth/forgot-password` | Envia um e-mail de recuperação de senha.      |
| `POST` | `/auth/reset-password`  | Redefine a senha do usuário.                  |

### Usuários

| Método | Rota              | Descrição                               |
| ------ | ----------------- | --------------------------------------- |
| `GET`  | `/user`           | Retorna todos os usuários.              |
| `GET`  | `/user/me`        | Retorna o usuário autenticado.          |
| `GET`  | `/user/:id`       | Retorna um usuário pelo ID.             |
| `PUT`  | `/user/update/:id`| Atualiza um usuário.                    |
| `DELETE`| `/user/delete/:id`| Desativa um usuário.                    |

### Posts

| Método | Rota                    | Descrição                               |
| ------ | ----------------------- | --------------------------------------- |
| `GET`  | `/posts`                | Retorna todos os posts.                 |
| `GET`  | `/posts/user/favorites` | Retorna os posts favoritados pelo usuário.|
| `GET`  | `/posts/user/:username` | Retorna os posts de um usuário.         |
| `GET`  | `/posts/user/posts`     | Retorna os posts do usuário autenticado.|
| `GET`  | `/posts/:id`            | Retorna um post pelo ID.                |
| `POST` | `/posts`                | Cria um novo post.                      |
| `PUT`  | `/posts/:id`            | Atualiza um post.                       |
| `DELETE`| `/posts/:id`            | Deleta um post.                         |
| `POST` | `/posts/:id/favorite`   | Favorita ou desfavorita um post.        |

### Categorias

| Método | Rota              | Descrição                               |
| ------ | ----------------- | --------------------------------------- |
| `GET`  | `/category/entire`| Retorna todas as categorias.            |
| `POST` | `/category/create`| Cria uma nova categoria.                |
| `PUT`  | `/category/update`| Atualiza uma categoria.                 |
| `DELETE`| `/category/delete`| Deleta uma categoria.                   |

### Tags

| Método | Rota         | Descrição                               |
| ------ | ------------ | --------------------------------------- |
| `GET`  | `/tags/entire`| Retorna todas as tags.                  |
| `GET`  | `/tags/:id`  | Retorna uma tag pelo ID.                |
| `POST` | `/tags`      | Cria uma nova tag.                      |
| `PUT`  | `/tags/:id`  | Atualiza uma tag.                       |
| `DELETE`| `/tags/:id`  | Deleta uma tag.                         |

### Comentários

| Método | Rota                | Descrição                               |
| ------ | ------------------- | --------------------------------------- |
| `GET`  | `/comment/entire`   | Retorna todos os comentários.           |
| `GET`  | `/comment/:id`      | Retorna um comentário pelo ID.          |
| `POST` | `/comment/create`   | Cria um novo comentário.                |
| `PUT`  | `/comment/:id/update`| Atualiza um comentário.                 |
| `DELETE`| `/comment/:id/delete`| Deleta um comentário.                   |

## 🔐 Autenticação

A autenticação é feita usando JSON Web Tokens (JWT). O fluxo de autenticação é o seguinte:

1.  O usuário se registra ou faz login.
2.  A API retorna um `accessToken` e um `refreshToken`.
3.  O `accessToken` é enviado no cabeçalho `Authorization` de cada solicitação para acessar rotas protegidas.
4.  O `refreshToken` é usado para obter um novo `accessToken` quando o atual expirar.

## 💾 Banco de Dados

Este projeto utiliza o Prisma como ORM para interagir com um banco de dados PostgreSQL. O esquema do banco de dados está definido em `prisma/schema.prisma`.

Para executar as migrações do banco de dados, use o seguinte comando:

```bash
npx prisma migrate dev
```

Para visualizar e interagir com os dados do banco de dados, você pode usar o Prisma Studio:

```bash
npx prisma studio
```

## 🚀 Deploy

Para fazer o deploy desta aplicação, você pode usar serviços como Heroku, Vercel, ou qualquer outro provedor de nuvem que suporte Node.js.

Lembre-se de configurar as variáveis de ambiente no seu provedor de deploy.

## 📄 Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.