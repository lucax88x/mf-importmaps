FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY infra/vite/package.json infra/vite/
COPY packages/components/package.json packages/components/
COPY packages/shell/package.json packages/shell/

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm turbo build --filter=@mf/shell

FROM nginx:alpine
COPY packages/shell/nginx.conf /etc/nginx/conf.d/default.conf
COPY packages/shell/docker-entrypoint.sh /docker-entrypoint.d/40-envsubst-importmap.sh
RUN chmod +x /docker-entrypoint.d/40-envsubst-importmap.sh
COPY --from=build /app/packages/shell/dist /usr/share/nginx/html
