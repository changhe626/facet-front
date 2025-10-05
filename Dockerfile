# --- Build Stage ---
# 使用与 package.json 引擎版本匹配的 Node.js LTS Alpine 镜像
FROM node:20-alpine AS builder

WORKDIR /app

# 优化：只拷贝 package.json 和 lock 文件，充分利用 Docker 缓存
COPY package*.json ./

# 使用 npm ci 而不是 install，确保可复现的构建
RUN npm ci

# 拷贝所有剩余文件 (此时 .dockerignore 会生效)
COPY . .

# 运行构建命令
RUN npm run build

# --- Final/Production Stage ---
# 使用最新的稳定版 Nginx Alpine 镜像
FROM nginx:stable-alpine

# 复制编译好的前端静态文件到 Nginx 的网站根目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义的 Nginx 配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

# 以前台模式运行 Nginx
CMD ["nginx", "-g", "daemon off;"]
