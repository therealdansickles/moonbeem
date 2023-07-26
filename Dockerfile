FROM node:16-alpine3.16

WORKDIR /app

COPY . .

RUN yarn set version stable
RUN yarn install --immutable

RUN yarn run build

EXPOSE 3000

CMD ["yarn", "start:prod"]
