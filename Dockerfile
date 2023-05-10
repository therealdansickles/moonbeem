FROM node:16-alpine3.16

WORKDIR /app

COPY . .

RUN yarn set version stable
RUN yarn install --immutable


RUN yarn run build

RUN echo $' yarn run start' >./entrypoint.sh

EXPOSE 3000

ENTRYPOINT [ "sh", "./entrypoint.sh" ]
