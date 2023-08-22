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

COPY --from=builder /app/.yarn/ ./.yarn/
COPY --from=builder /app/package.json /app/yarn.lock /app/.yarnrc.yml /app/.pnp.cjs ./
COPY --from=builder /app/dist ./dist

EXPOSE ${PORT}

CMD ["yarn", "start:prod"]
