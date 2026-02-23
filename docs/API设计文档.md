# 校园论坛项目 - API设计文档

## 📋 文档信息

- **设计日期：** 2026-02-06
- **API版本：** v1.0
- **设计原则：** RESTful、统一响应、类型安全

---

## 一、设计原则

### 1.1 RESTful规范

- **资源导向：** 使用名词表示资源，动词表示操作
- **HTTP方法：** GET（查询）、POST（创建）、PUT（更新）、DELETE（删除）
- **URL设计：** 简洁、语义化、层级清晰
- **状态码：** 正确使用HTTP状态码

### 1.2 统一响应格式

所有API响应使用统一格式：

**成功响应：**
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

**错误响应：**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息",
    "details": {}
  }
}
```

### 1.3 认证机制

- **JWT Token：** 使用JWT进行身份认证
- **Token存储：** 前端存储在localStorage或httpOnly cookie
- **Token刷新：** 支持Token刷新机制（可选）

---

## 二、API基础信息

### 2.1 基础URL

```
开发环境：http://localhost:3000/api
生产环境：https://api.youruniversity.com/api
```

### 2.2 API版本

```
/api/v1/...
```

### 2.3 请求头

```
Content-Type: application/json
Authorization: Bearer <token>
```

---

## 三、错误码定义

### 3.1 认证错误（1xxx）

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| UNAUTHORIZED | 401 | 未授权，需要登录 |
| FORBIDDEN | 403 | 无权限访问 |
| TOKEN_EXPIRED | 401 | Token已过期 |
| TOKEN_INVALID | 401 | Token无效 |

### 3.2 验证错误（2xxx）

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| VALIDATION_ERROR | 400 | 验证失败 |
| INVALID_INPUT | 400 | 输入无效 |
| MISSING_REQUIRED_FIELD | 400 | 缺少必填字段 |

### 3.3 资源错误（3xxx）

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| NOT_FOUND | 404 | 资源不存在 |
| ALREADY_EXISTS | 409 | 资源已存在 |
| RESOURCE_CONFLICT | 409 | 资源冲突 |

### 3.4 服务器错误（5xxx）

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| DATABASE_ERROR | 500 | 数据库错误 |
| SERVICE_UNAVAILABLE | 503 | 服务不可用 |

---

## 四、API接口列表

### 4.1 认证模块（/api/auth）

#### 用户注册
```
POST /api/auth/register
```

**请求体：**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "phone": "13800138000" // 可选
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username"
    },
    "token": "jwt_token"
  }
}
```

#### 用户登录
```
POST /api/auth/login
```

**请求体：**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "avatarUrl": "https://..."
    },
    "token": "jwt_token"
  }
}
```

#### 获取当前用户
```
GET /api/auth/me
```

**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "avatarUrl": "https://...",
    "bio": "...",
    "isVerified": false
  }
}
```

#### 用户登出
```
POST /api/auth/logout
```

---

### 4.2 用户模块（/api/users）

#### 获取用户信息
```
GET /api/users/:id
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "username",
    "avatarUrl": "https://...",
    "bio": "...",
    "postCount": 10,
    "followerCount": 20,
    "followingCount": 15,
    "isFollowing": false // 当前用户是否关注
  }
}
```

#### 更新用户信息
```
PUT /api/users/:id
```

**请求头：**
```
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "username": "new_username",
  "bio": "new bio",
  "avatarUrl": "https://..."
}
```

---

### 4.3 帖子模块（/api/posts）

#### 获取帖子列表
```
GET /api/posts
```

**查询参数：**
- `page` - 页码（默认1）
- `limit` - 每页数量（默认20）
- `categoryId` - 分类ID（可选）
- `sort` - 排序方式（latest, hot, popular）
- `keyword` - 搜索关键词（可选）

**响应：**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "uuid",
        "title": "帖子标题",
        "content": "帖子内容...",
        "images": ["https://..."],
        "viewCount": 100,
        "likeCount": 10,
        "commentCount": 5,
        "createdAt": "2026-02-06T...",
        "user": {
          "id": "uuid",
          "username": "username",
          "avatarUrl": "https://..."
        },
        "category": {
          "id": "uuid",
          "name": "学习",
          "slug": "study"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### 获取帖子详情
```
GET /api/posts/:id
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "帖子标题",
    "content": "帖子完整内容...",
    "images": ["https://..."],
    "viewCount": 100,
    "likeCount": 10,
    "commentCount": 5,
    "isLiked": false,
    "isFavorited": false,
    "createdAt": "2026-02-06T...",
    "updatedAt": "2026-02-06T...",
    "user": {
      "id": "uuid",
      "username": "username",
      "avatarUrl": "https://..."
    },
    "category": {
      "id": "uuid",
      "name": "学习",
      "slug": "study"
    }
  }
}
```

#### 创建帖子
```
POST /api/posts
```

**请求头：**
```
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "title": "帖子标题",
  "content": "帖子内容",
  "categoryId": "uuid",
  "images": ["https://..."] // 可选
}
```

#### 更新帖子
```
PUT /api/posts/:id
```

**请求头：**
```
Authorization: Bearer <token>
```

#### 删除帖子
```
DELETE /api/posts/:id
```

**请求头：**
```
Authorization: Bearer <token>
```

---

### 4.4 评论模块（/api/comments）

#### 获取评论列表
```
GET /api/posts/:postId/comments
```

**查询参数：**
- `page` - 页码（默认1）
- `limit` - 每页数量（默认20）

**响应：**
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": "uuid",
        "content": "评论内容",
        "likeCount": 5,
        "replyCount": 2,
        "createdAt": "2026-02-06T...",
        "user": {
          "id": "uuid",
          "username": "username",
          "avatarUrl": "https://..."
        },
        "replies": [
          {
            "id": "uuid",
            "content": "回复内容",
            "likeCount": 2,
            "createdAt": "2026-02-06T...",
            "user": {
              "id": "uuid",
              "username": "username2",
              "avatarUrl": "https://..."
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50
    }
  }
}
```

#### 创建评论
```
POST /api/posts/:postId/comments
```

**请求头：**
```
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "content": "评论内容",
  "parentId": "uuid" // 可选，回复评论时使用
}
```

#### 更新评论
```
PUT /api/comments/:id
```

#### 删除评论
```
DELETE /api/comments/:id
```

---

### 4.5 互动模块（/api/interactions）

#### 点赞帖子/评论
```
POST /api/posts/:id/like
POST /api/comments/:id/like
```

**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likeCount": 11
  }
}
```

#### 取消点赞
```
DELETE /api/posts/:id/like
DELETE /api/comments/:id/like
```

#### 收藏帖子
```
POST /api/posts/:id/favorite
```

**请求头：**
```
Authorization: Bearer <token>
```

#### 取消收藏
```
DELETE /api/posts/:id/favorite
```

---

### 4.6 私信模块（/api/messages）

#### 获取对话列表
```
GET /api/conversations
```

**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "userId": "uuid",
        "username": "username",
        "avatarUrl": "https://...",
        "lastMessage": {
          "content": "最后一条消息",
          "createdAt": "2026-02-06T..."
        },
        "unreadCount": 2
      }
    ]
  }
}
```

#### 获取对话详情
```
GET /api/conversations/:userId
```

**查询参数：**
- `page` - 页码
- `limit` - 每页数量

#### 发送消息
```
POST /api/conversations/:userId/messages
```

**请求头：**
```
Authorization: Bearer <token>
```

**请求体：**
```json
{
  "content": "消息内容",
  "imageUrl": "https://..." // 可选
}
```

#### 标记消息已读
```
PUT /api/messages/:id/read
```

#### 获取未读消息数
```
GET /api/messages/unread-count
```

---

### 4.7 分类模块（/api/categories）

#### 获取分类列表
```
GET /api/categories
```

**响应：**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "学习",
        "slug": "study",
        "description": "学习相关话题",
        "icon": "📚",
        "color": "#3b82f6",
        "postCount": 100
      }
    ]
  }
}
```

---

### 4.8 学习资料模块（/api/resources）

#### 获取资料列表
```
GET /api/resources
```

**查询参数：**
- `page` - 页码
- `limit` - 每页数量
- `userId` - 用户ID（可选）

#### 上传资料
```
POST /api/resources
```

**请求头：**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求体：**
```
title: 资料标题
description: 资料描述
file: 文件
isPublic: true/false
```

#### 下载资料
```
POST /api/resources/:id/download
```

---

### 4.9 关注模块（/api/follows）

#### 关注用户
```
POST /api/users/:id/follow
```

**请求头：**
```
Authorization: Bearer <token>
```

#### 取消关注
```
DELETE /api/users/:id/follow
```

#### 获取关注列表
```
GET /api/users/:id/following
```

#### 获取粉丝列表
```
GET /api/users/:id/followers
```

---

### 4.10 通知模块（/api/notifications）

#### 获取通知列表
```
GET /api/notifications
```

**查询参数：**
- `page` - 页码
- `limit` - 每页数量
- `isRead` - 是否已读（可选）

#### 标记通知已读
```
PUT /api/notifications/:id/read
```

#### 标记所有通知已读
```
PUT /api/notifications/read-all
```

#### 获取未读通知数
```
GET /api/notifications/unread-count
```

---

### 4.11 搜索模块（/api/search）

#### 搜索帖子
```
GET /api/search/posts
```

**查询参数：**
- `keyword` - 搜索关键词（必填）
- `page` - 页码
- `limit` - 每页数量
- `categoryId` - 分类ID（可选）

**响应：**
```json
{
  "success": true,
  "data": {
    "posts": [...],
    "pagination": {...}
  }
}
```

---

## 五、分页规范

### 5.1 查询参数

- `page` - 页码（从1开始，默认1）
- `limit` - 每页数量（默认20，最大100）

### 5.2 响应格式

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 六、认证流程

### 6.1 Token格式

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### 6.2 Token过期时间

- Access Token: 7天
- Refresh Token: 30天（可选）

### 6.3 请求头格式

```
Authorization: Bearer <token>
```

---

## 七、文件上传

### 7.1 图片上传

**接口：**
```
POST /api/upload/image
```

**请求头：**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求体：**
```
file: 图片文件（最大5MB）
```

**响应：**
```json
{
  "success": true,
  "data": {
    "url": "https://oss.example.com/image.jpg"
  }
}
```

### 7.2 文件上传

**接口：**
```
POST /api/upload/file
```

**限制：**
- 最大文件大小：50MB
- 支持格式：pdf, doc, docx, ppt, pptx, xls, xlsx, zip, rar

---

## 八、API使用示例

### 8.1 用户注册

```typescript
const response = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    username: 'username',
    password: 'password123',
  }),
});

const data = await response.json();
if (data.success) {
  localStorage.setItem('token', data.data.token);
}
```

### 8.2 获取帖子列表

```typescript
const response = await fetch('http://localhost:3000/api/posts?page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const data = await response.json();
```

---

## 九、API测试

### 9.1 测试工具

- Postman
- Insomnia
- curl

### 9.2 测试环境

```
开发环境：http://localhost:3000/api
```

---

## 十、总结

### 10.1 API统计

- **认证模块：** 4个接口
- **用户模块：** 2个接口
- **帖子模块：** 5个接口
- **评论模块：** 4个接口
- **互动模块：** 4个接口
- **私信模块：** 5个接口
- **分类模块：** 1个接口
- **学习资料模块：** 3个接口
- **关注模块：** 4个接口
- **通知模块：** 4个接口
- **搜索模块：** 1个接口
- **文件上传：** 2个接口

**总计：** 39个API接口

### 10.2 设计特点

✅ **RESTful规范** - 遵循RESTful设计原则  
✅ **统一响应** - 统一的响应格式和错误处理  
✅ **类型安全** - TypeScript类型定义  
✅ **认证机制** - JWT Token认证  
✅ **分页支持** - 统一的分页规范  
✅ **错误处理** - 完善的错误码定义

---

**文档版本：** v1.0  
**创建日期：** 2026-02-06  
**状态：** ✅ 设计完成
