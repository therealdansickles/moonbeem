<p align="center">
  <a href="https://platform-staging.vibe.xyz/graphql" target="blank"><img src="https://vibe.xyz/vibe.jpg" width="200" alt="Vibe" /></a>
  The Platform API™️
</p>

[![CI](https://github.com/vibexyz/vibe-server-restful/actions/workflows/ci.yml/badge.svg)](https://github.com/vibexyz/vibe-server-restful/actions/workflows/ci.yml)

:clipboard: https://studio.apollographql.com/graph/V1-Staging-8tuw9f/variant/current/home ( Apollo Graph )

:clipboard: https://railway.app/project/18a37276-7b78-4adb-b6e4-91a6c4df89cf ( "staging" )

:clipboard: https://railway.app/project/6ee0852c-c977-4984-af99-af6405c87bcc ( "prod" )

# Quickstart

## Use Staging
You can interact with the Staging API in following ways:
- use the Apollo GraphQL explorer: https://studio.apollographql.com/graph/V1-Staging-8tuw9f/variant/current/home
- or query the GraphQL endpoint directly: https://platform-staging.vibe.xyz/graphql

## Use Docker
To get the project up and running quickly, you can use Docker:
```sh
docker compose up -d
```

This command will build the project using [`Dockerfile`](/Dockerfile) and start additional services declared in the [`docker-compose.yml`](/docker-compose.yml).

You can verify that everything is working as expected by checking Docker containers logs:

```sh
docker compose logs
```

# Installation / Development

## 1. Loading services with Docker

Make sure you have started the docker compose for the vibe base middleware and get some accessible middleware endpoints(postgres url).

This repository also adds those services for your convenience.

```sh
docker compose up postgres postgres-sync-chain -d
```

## Install Deps

We use `yarn`, so you can build install the deps like so:

```sh
yarn install
```

If you haven't already, you'll also need to set yourself up with some `.env`. First copy the [`.env.template`](.env.template) in this repository to your local `.env`

## Booting up the Application

Once that's good to go, you can boot the app:

```sh
# development
$ yarn start

# watch mode
$ yarn dev

# production mode
$ yarn start:prod
```

# Testing

We have our test suite setup on GitHub Actions. Locally, you can just run `yarn test:ci` to go through the suite. Using `yarn test` currently is broken.

### Syncing database tables with schema objects

Before running test make sure database tables are in sync with schema objects. You can do that by running following commands:

```sh
typeorm:schema:sync # for default postgres db
typeorm:schema:sync-chain:sync # for sync chain postgres db
```

### Specific / Single Tests

For specific test examples, try `yarn test src/membership` or the path you want to run.

### E2E

`yarn test:e2e` runs our e2e test. Note that it's currently not active and not fully functional. See any `resolver.spec` though as they act as e2e tests currently.

### Coverage

`yarn test:cov` but these are currently not setup on CI/CD or working.

### CI

CI executes the following command to run the suite: `yarn test:ci`.

## IDE setup

Since project is using Yarn v3 with [Plug'n'Play installs](https://yarnpkg.com/features/pnp), it requires some additional configuration. In order to generate and apply changes for your IDE of choice, please follow [these](https://yarnpkg.com/getting-started/editor-sdks) steps.
