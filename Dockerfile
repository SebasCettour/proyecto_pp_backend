FROM node:20

WORKDIR /app

COPY package*.json .
COPY tsconfig.json .

RUN npm install
RUN npm install typescript ts-node --save-dev

COPY . .

RUN tsc

EXPOSE 4000

CMD ["npm", "run", "dev"]