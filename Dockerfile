# Base
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el código
COPY . .

# Exponer el puerto del backend
EXPOSE 4000

# Comando de inicio en modo desarrollo
CMD ["npm", "run", "dev"]
