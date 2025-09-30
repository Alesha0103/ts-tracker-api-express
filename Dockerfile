FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000
CMD ["npx", "ts-node-dev", "--respawn", "src/index.ts"]
