FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate --schema prisma/schema.prisma
RUN npm run build

EXPOSE 8000

CMD ["sh", "-c", "npx prisma db push --schema prisma/schema.prisma && node prisma/seed.js && node dist/main"]
