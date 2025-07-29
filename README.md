<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>

# Veritas Lux API

Welcome to the Veritas Lux API, a robust backend solution built with NestJS. This API provides a comprehensive set of features for managing users, posts, categories, tags, and comments, including authentication and authorization.

## Project Structure

The project structure is organized as follows:

| Path                  | Description                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/`                | Contains the source code of the application.                                                          |
| `src/auth`            | Handles authentication, including registration, login, token management, and password recovery.       |
| `src/user`            | Manages user-related operations, such as creating, retrieving, updating, and deleting users.          |
| `src/post`            | Manages blog posts, including CRUD operations and other post-related functionalities.                 |
| `src/category`        | Manages post categories, allowing for organization and filtering of content.                          |
| `src/tag`             | Manages tags that can be associated with posts for more granular classification.                      |
| `src/comment`         | Handles comments on posts, including creation, retrieval, and moderation.                             |
| `src/prisma`          | Contains the Prisma service for database interactions, ensuring a typed and consistent data access layer. |
| `src/guards`          | Implements route protection guards, such as JWT-based authentication.                                 |
| `src/strategies`      | Contains authentication strategies, like the JWT strategy for validating access tokens.               |
| `src/decorator`       | Includes custom decorators, such as `@Public` to mark routes that do not require authentication.      |
| `src/resend`          | Service for sending emails, for example, for password recovery or other notifications.                |
| `prisma/`             | Contains the Prisma schema file (`schema.prisma`), which defines the database models and relations.   |
| `dist/`               | Contains the compiled JavaScript code, ready for production deployment.                               |
| `node_modules/`       | Contains all the project dependencies.                                                                |
| `test/`               | Contains the end-to-end tests of the application.                                                     |
| `.gitignore`          | Specifies which files and directories should be ignored by Git.                                       |
| `package.json`        | Lists the project's dependencies and scripts.                                                         |
| `tsconfig.json`       | The main TypeScript configuration file.                                                               |
| `nest-cli.json`       | Configuration file for the NestJS CLI.                                                                |
| `eslint.config.mjs`   | ESLint configuration for code linting.                                                                |

---

## Environment Variables

To run this project, you will need to create a `.env` file in the root directory and add the following environment variables:

```bash
# .env

# Application
PORT=3000

# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# JWT
JWT_SECRET_KEY="your-secret-key"
JWT_REFRESH_SECRET_KEY="your-refresh-secret-key"

# Resend
API_KEY="your-api-key"
```

---

## Installation

To get started with the project, follow these steps:

```bash
# 1. Clone the repository
$ git clone https://github.com/your-username/veritas-lux-api.git

# 2. Navigate to the project directory
$ cd veritas-lux-api

# 3. Install the dependencies
$ npm install
```

---

## Running the App

You can run the application in different modes:

```bash
# Development mode
$ npm run start

# Watch mode (restarts the server on file changes)
$ npm run start:dev

# Production mode
$ npm run start:prod
```

---

## Test

To run the tests, use the following commands:

```bash
# Unit tests
$ npm run test

# End-to-end tests
$ npm run test:e2e

# Test coverage
$ npm run test:cov
```

---

## Available Scripts

The `package.json` file contains the following scripts:

| Script          | Description                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `build`         | Compiles the TypeScript code into JavaScript.                                                           |
| `format`        | Formats the code using Prettier.                                                                        |
| `start`         | Starts the application in development mode.                                                             |
| `start:dev`     | Starts the application in watch mode, automatically restarting on file changes.                         |
| `start:debug`   | Starts the application in debug mode.                                                                   |
| `start:prod`    | Starts the application in production mode.                                                              |
| `lint`          | Lints the code using ESLint.                                                                            |
| `test`          | Runs unit tests.                                                                                        |
| `test:watch`    | Runs unit tests in watch mode.                                                                          |
| `test:cov`      | Generates a test coverage report.                                                                       |
| `test:debug`    | Runs unit tests in debug mode.                                                                          |
| `test:e2e`      | Runs end-to-end tests.                                                                                  |

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
