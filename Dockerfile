FROM node:16-alpine3.16

WORKDIR /app

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

RUN yarn run build

RUN echo $' \
if [[ $NODE_ENV == "dev" ]] \n \
then \n \
    yarn run dev \n \
else \n \
    yarn start \n \
fi \n \
' \
    >./entrypoint.sh

EXPOSE 3000

ENTRYPOINT [ "sh", "./entrypoint.sh" ]
