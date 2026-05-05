FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate --schema prisma/schema.prisma
RUN npm run build

EXPOSE 8000

CMD ["sh", "-c", "npx prisma db push --schema prisma/schema.prisma && npx ts-node --transpile-only prisma/seed.ts && node dist/main"]
