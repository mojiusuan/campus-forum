import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 获取资料列表
 * GET /api/resources
 */
export async function getResources(req: Request, res: Response) {
  try {
    const userId = req.query.userId as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    // 获取当前登录用户ID（如果有）
    const currentUserId = (req as any).user?.userId;

    // 构建查询条件
    const where: any = {
      isDeleted: false,
    };

    // 如果指定了用户ID，筛选该用户的资料
    if (userId) {
      where.userId = userId;
      // 如果查看的是自己的资料，显示所有（包括私有）
      // 如果查看别人的资料，只显示公开的
      if (userId !== currentUserId) {
        where.isPublic = true;
      }
    } else {
      // 如果没有指定用户ID，返回公开的资料
      // 如果用户已登录，也返回该用户的私有资料
      if (currentUserId) {
        where.OR = [
          { isPublic: true },
          { userId: currentUserId, isPublic: false },
        ];
      } else {
        where.isPublic = true;
      }
    }

    // 获取资料列表
    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.resource.count({
        where,
      }),
    ]);

    // 格式化响应数据
    const formattedResources = resources.map((resource) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      fileUrl: resource.fileUrl,
      fileName: resource.fileName,
      fileSize: resource.fileSize,
      fileType: resource.fileType,
      downloadCount: resource.downloadCount,
      isPublic: resource.isPublic,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      user: {
        id: resource.user.id,
        username: resource.user.username,
        avatarUrl: resource.user.avatarUrl,
      },
    }));

    sendSuccess(res, {
      resources: formattedResources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error('获取资料列表失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '获取资料列表失败', error.message);
  }
}

/**
 * 上传资料
 * POST /api/resources
 */
export async function createResource(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;
    const { title, description, isPublic } = req.body;
    const file = req.file;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 验证输入
    if (!title || title.trim().length === 0) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '资料标题不能为空');
    }

    if (title.length > 200) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '资料标题不能超过200个字符');
    }

    if (description && description.length > 2000) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '资料描述不能超过2000个字符');
    }

    if (!file) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '请选择要上传的文件');
    }

    // 确定文件类型
    const getFileType = (mimetype: string, originalname: string): string => {
      const ext = path.extname(originalname).toLowerCase();
      const mimeMap: Record<string, string> = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/zip': 'zip',
        'application/x-rar-compressed': 'rar',
      };

      if (mimeMap[mimetype]) {
        return mimeMap[mimetype];
      }

      // 根据扩展名判断
      const extMap: Record<string, string> = {
        '.pdf': 'pdf',
        '.doc': 'doc',
        '.docx': 'docx',
        '.ppt': 'ppt',
        '.pptx': 'pptx',
        '.xls': 'xls',
        '.xlsx': 'xlsx',
        '.zip': 'zip',
        '.rar': 'rar',
      };

      return extMap[ext] || 'other';
    };

    const fileType = getFileType(file.mimetype, file.originalname);
    const fileUrl = `/uploads/files/${file.filename}`;

    // 处理 isPublic 字段（可能是字符串 "true"/"false" 或布尔值）
    let isPublicValue = false;
    if (isPublic !== undefined) {
      if (typeof isPublic === 'string') {
        isPublicValue = isPublic.toLowerCase() === 'true';
      } else {
        isPublicValue = Boolean(isPublic);
      }
    } else {
      // 默认公开
      isPublicValue = true;
    }

    // 创建资料记录
    const resource = await prisma.resource.create({
      data: {
        userId,
        title: title.trim(),
        description: description ? description.trim() : null,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        fileType,
        isPublic: isPublicValue,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    sendSuccess(res, {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      fileUrl: resource.fileUrl,
      fileName: resource.fileName,
      fileSize: resource.fileSize,
      fileType: resource.fileType,
      downloadCount: resource.downloadCount,
      isPublic: resource.isPublic,
      createdAt: resource.createdAt,
      user: {
        id: resource.user.id,
        username: resource.user.username,
        avatarUrl: resource.user.avatarUrl,
      },
    }, '资料上传成功', 201);
  } catch (error: any) {
    console.error('上传资料失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '上传资料失败', error.message);
  }
}

/**
 * 获取资料详情
 * GET /api/resources/:id
 */
export async function getResourceById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId; // 可选，用于判断权限

    // 查找资料
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!resource) {
      return sendError(res, ErrorCode.NOT_FOUND, '资料不存在');
    }

    if (resource.isDeleted) {
      return sendError(res, ErrorCode.NOT_FOUND, '资料已删除');
    }

    // 验证权限（私有资料只能作者查看）
    if (!resource.isPublic && resource.userId !== userId) {
      return sendError(res, ErrorCode.FORBIDDEN, '无权查看此资料');
    }

    sendSuccess(res, {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      fileUrl: resource.fileUrl,
      fileName: resource.fileName,
      fileSize: resource.fileSize,
      fileType: resource.fileType,
      downloadCount: resource.downloadCount,
      isPublic: resource.isPublic,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      user: {
        id: resource.user.id,
        username: resource.user.username,
        avatarUrl: resource.user.avatarUrl,
      },
    });
  } catch (error: any) {
    console.error('获取资料详情失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '获取资料详情失败', error.message);
  }
}

/**
 * 删除资料
 * DELETE /api/resources/:id
 */
export async function deleteResource(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 查找资料
    const resource = await prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      return sendError(res, ErrorCode.NOT_FOUND, '资料不存在');
    }

    if (resource.isDeleted) {
      return sendError(res, ErrorCode.NOT_FOUND, '资料已删除');
    }

    // 验证权限（只能删除自己的资料）
    if (resource.userId !== userId) {
      return sendError(res, ErrorCode.FORBIDDEN, '无权删除此资料');
    }

    // 软删除资料
    await prisma.resource.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    sendSuccess(res, null, '资料删除成功');
  } catch (error: any) {
    console.error('删除资料失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '删除资料失败', error.message);
  }
}

/**
 * 下载资料
 * POST /api/resources/:id/download
 */
export async function downloadResource(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId; // 可选，用于统计下载

    // 查找资料
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!resource) {
      return sendError(res, ErrorCode.NOT_FOUND, '资料不存在');
    }

    if (resource.isDeleted) {
      return sendError(res, ErrorCode.NOT_FOUND, '资料已删除');
    }

    // 验证权限（私有资料只能作者下载）
    if (!resource.isPublic && resource.userId !== userId) {
      return sendError(res, ErrorCode.FORBIDDEN, '无权下载此资料');
    }

    // 构建文件路径（resource.fileUrl 格式：/uploads/files/filename）
    // 需要从 /uploads/files/filename 提取 filename
    const fileName = path.basename(resource.fileUrl);
    const filePath = path.join(__dirname, '../../uploads/files', fileName);
    const absolutePath = path.resolve(filePath);

    // 检查文件是否存在
    if (!fs.existsSync(absolutePath)) {
      console.error('文件不存在:', absolutePath);
      console.error('resource.fileUrl:', resource.fileUrl);
      console.error('提取的文件名:', fileName);
      return sendError(res, ErrorCode.NOT_FOUND, '文件不存在');
    }

    // 更新下载次数
    await prisma.resource.update({
      where: { id },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    }).catch((err) => {
      // 下载次数更新失败不影响下载
      console.error('更新下载次数失败:', err);
    });

    // 读取文件并发送
    try {
      const fileBuffer = fs.readFileSync(absolutePath);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(resource.fileName)}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', fileBuffer.length.toString());
      res.send(fileBuffer);
    } catch (fileError: any) {
      console.error('读取文件失败:', fileError);
      return sendError(res, ErrorCode.INTERNAL_ERROR, '文件读取失败', fileError.message);
    }
  } catch (error: any) {
    console.error('下载资料失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '下载资料失败', error.message);
  }
}
