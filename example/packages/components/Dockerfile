FROM node:24-alpine AS build
RUN corepack enable
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/vite-plugin/package.json packages/vite-plugin/
COPY example/packages/components/package.json example/packages/components/

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm turbo build --filter=@mf/components

FROM nginx:alpine
COPY example/packages/components/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/example/packages/components/dist /usr/share/nginx/html
