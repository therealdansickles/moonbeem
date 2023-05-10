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

Use the Apollog explorer: https://studio.apollographql.com/graph/V1-Staging-8tuw9f/variant/current/home

or visit the endpoint directly: https://platform-staging.vibe.xyz/graphql

## Use Docker

```sh
docker compose up
```

# Installation / Development

## 1. Loading services with Docker

Make sure you have started the docker compose for the vibe base middleware. and get some accessible middleware endpoints(postgres url, mongo url, redis url).

This repository also adds those services for your convenience.

```sh
docker compose up postgres redis -d
```

## Install Deps

We use `yarn`, so you can build install the deps like so:

```sh
yarn install
```

If you haven't already, you'll also need to set yourself up with some `.env`. First copy the [`.env.template`](.env.template) in this repository to your local `.env`

## Booting up the Application

Once that's good to go, you can boo the app:

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

### Specific / Single Tests

For specific test examples, try `yarn test src/membership` or the path you want to run.

### E2E

`yarn test:e2e` runs our e2e test. Note that it's currently not active and not fully functional. See any `resolver.spec` though as they act as e2e tests currently.

### Coverage

`yarn test:cov` but these are currently not setup on CI/CD or working.

### CI

CI executes the following command to run the suite: `yarn test:ci`.
