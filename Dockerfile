# --- 1. ビルドステージ ---
# ビルドに必要な全ての依存関係をインストールし、アプリケーションをビルドする
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- 2. 本番ステージ ---
# ビルドステージから、実行に必要なファイルだけをコピーする
FROM node:18-alpine
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package.json ./package.json

ENV NODE_ENV=production
# 正しいコンパイル後のサーバーファイルを指定する
CMD ["node", "dist/server.js"]