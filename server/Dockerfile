FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm install --no-audit --no-fund
COPY prisma ./prisma
RUN npx prisma generate
COPY src ./src

RUN mkdir -p /app/uploads && chown -R node:node /app
USER node
EXPOSE 8080
CMD ["sh", "-c", "npx prisma db push && npm start"]
