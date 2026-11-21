FROM node:24-bookworm-slim
WORKDIR /app

# better-sqlite3-র তৈরি বাইনারি না পেলে কম্পাইল করতে এগুলো লাগে।
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV PORT=4000 DB_PATH=/app/data/doomsday.db
EXPOSE 4000
CMD ["node", "src/server.js"]