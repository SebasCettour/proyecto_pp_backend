FROM node:20-alpine
WORKDIR /app

# Instala dependencias (prod + dev)
COPY package*.json ./
RUN npm install

# Copia el código fuente
COPY . .

# Exponer puerto
EXPOSE 4000

# Comando de desarrollo
CMD ["npx", "nodemon", "--watch", "src", "--ext", "ts", "--exec", "npx ts-node src/server.ts"]
