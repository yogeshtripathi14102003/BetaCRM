FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY scripts ./scripts
RUN mkdir -p storage/uploads && chown -R node:node storage
USER node
EXPOSE 5000
CMD ["node", "src/server.js"]
