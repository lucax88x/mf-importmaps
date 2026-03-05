FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/vite-plugin/package.json packages/vite-plugin/
COPY example/packages/components/package.json example/packages/components/
COPY example/packages/shell/package.json example/packages/shell/

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm turbo build --filter=@mf/example-shell

FROM nginx:alpine
COPY example/packages/shell/nginx.conf /etc/nginx/conf.d/default.conf
COPY example/packages/shell/docker-entrypoint.sh /docker-entrypoint.d/40-envsubst-importmap.sh
RUN chmod +x /docker-entrypoint.d/40-envsubst-importmap.sh
COPY --from=build /app/example/packages/shell/dist /usr/share/nginx/html
