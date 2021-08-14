FROM node:12

WORKDIR /app

ENV PORT 80

COPY package.json ./

RUN npm install

COPY . .

CMD  ["node", "server.js"]