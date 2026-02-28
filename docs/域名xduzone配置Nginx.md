# 域名 www.xduzone.site 配置 Nginx

当前访问显示「Welcome to nginx!」是因为 Nginx 还在用默认站点，需要改为指向论坛前端并转发 API。

---

## 一、在服务器上创建并启用配置

### 1. 创建站点配置

```bash
sudo nano /etc/nginx/sites-available/forum-xduzone
```

**粘贴以下内容（已按 www.xduzone.site 写好）：**

```nginx
server {
    listen 80;
    server_name www.xduzone.site xduzone.site;

    access_log /var/log/nginx/forum-xduzone-access.log;
    error_log /var/log/nginx/forum-xduzone-error.log;

    client_max_body_size 10M;
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # 后端 API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 上传文件
    location /uploads {
        alias /var/www/forum/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 前端静态
    location / {
        root /var/www/forum/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/forum/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

保存退出（Ctrl+O 回车，Ctrl+X）。

### 2. 关闭默认站点并启用论坛站点

```bash
# 删除默认站点的启用链接（不再显示 Welcome to nginx）
sudo rm -f /etc/nginx/sites-enabled/default

# 启用论坛站点
sudo ln -sf /etc/nginx/sites-available/forum-xduzone /etc/nginx/sites-enabled/

# 检查配置是否有语法错误
sudo nginx -t

# 无误后重载 Nginx
sudo systemctl reload nginx
```

### 3. 确认后端和前端已部署

- 后端：`pm2 list` 里有 `forum-api` 且在运行；`curl -s http://localhost:3000/api/health` 有正常 JSON 返回。
- 前端：`/var/www/forum/frontend/dist` 目录存在且有 `index.html`（在 `frontend` 目录执行过 `npm run build`）。

---

## 二、前端生产环境 API 地址（同域名时可不填）

若用户只通过 **www.xduzone.site** 访问（API 也是同域名下的 `/api`），前端构建时**不要**设置 `VITE_API_URL`，或设为空，这样请求会发到当前域名的 `/api`。

在服务器上构建前端时：

```bash
cd /var/www/forum/frontend
# 不创建 .env.production 或内容为空即可；或仅写：
# VITE_API_URL=
echo 'VITE_API_URL=' > .env.production
npm run build
```

若你以后用单独域名做 API（例如 `api.xduzone.site`），再在 `.env.production` 里写 `VITE_API_URL=https://api.xduzone.site` 并重新 `npm run build`。

---

## 三、配置 HTTPS（消除「不安全」提示）

域名能正常打开论坛后，建议配置 SSL：

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d www.xduzone.site -d xduzone.site
```

按提示输入邮箱、同意条款，选择是否重定向 HTTP 到 HTTPS。完成后访问会变成 `https://www.xduzone.site`，浏览器不再显示「不安全」。

---

## 四、后端 CORS（若只用 www.xduzone.site）

若前后端都通过 **www.xduzone.site** 访问，后端 `.env` 里 CORS 可设为：

```env
CORS_ORIGIN=https://www.xduzone.site
```

若暂时仍用 HTTP，可写：

```env
CORS_ORIGIN=http://www.xduzone.site
```

修改后执行：`pm2 restart forum-api`。

---

完成后在浏览器访问 **http://www.xduzone.site**（或配置 HTTPS 后访问 **https://www.xduzone.site**），应看到论坛展示页/论坛首页，而不再是 Nginx 默认页。
