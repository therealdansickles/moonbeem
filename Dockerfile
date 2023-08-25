FROM node:16-alpine3.16 AS builder

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml .pnp.cjs ./
COPY .yarn .yarn
RUN yarn set version stable
RUN yarn install --immutable

COPY . .
RUN yarn run build

FROM node:16-alpine3.16

WORKDIR /app

COPY --from=builder /app .

EXPOSE ${PORT}

CMD ["yarn", "start:migrate:prod"]
