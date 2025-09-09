# Etapa de desarrollo
FROM node:20 AS dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "dev"]

# Etapa de producción
FROM node:20 AS prod

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

RUN npm run build

CMD ["npm", "start"]