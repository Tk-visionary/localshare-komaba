FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate || true
ENV NODE_ENV=production
CMD ["node","server.js"]
