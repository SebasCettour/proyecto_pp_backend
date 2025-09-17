# ===========================
# Etapa de desarrollo
# ===========================
FROM node:20 AS dev

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json primero (para aprovechar cache de Docker)
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies como nodemon)
RUN npm install

# Opcional: instalar nodemon globalmente para asegurarnos de que esté disponible
RUN npm install -g nodemon

# Copiar el resto del código
COPY . .

# Exponer el puerto que usa tu servidor
EXPOSE 4000

# Comando por defecto en desarrollo
CMD ["npm", "run", "dev"]

# ===========================
# Etapa de producción
# ===========================
FROM node:20 AS prod

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm install --omit=dev

# Copiar el resto del código
COPY . .

# Construir el proyecto TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 4000

# Comando por defecto en producción
CMD ["npm", "start"]
