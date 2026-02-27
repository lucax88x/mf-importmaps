FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY infra/vite/package.json infra/vite/
COPY packages/components/package.json packages/components/
COPY packages/shell/package.json packages/shell/

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm turbo build --filter=@mf/components

FROM nginx:alpine
COPY packages/components/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/components/dist /usr/share/nginx/html
