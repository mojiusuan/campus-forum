import type { Request, Response } from 'express-serve-static-core';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, '../../uploads');
const imagesDir = path.join(uploadsDir, 'images');
const filesDir = path.join(uploadsDir, 'files');
const studentIdDir = path.join(uploadsDir, 'images', 'student-id');

[uploadsDir, imagesDir, filesDir, studentIdDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 图片存储配置
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  },
});

// 文件存储配置
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, filesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `file-${uniqueSuffix}${ext}`);
  },
});

// 图片文件过滤器
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPEG、PNG、GIF、WebP 格式的图片'));
  }
};

// 文件过滤器
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-rar-compressed',
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件格式。支持：PDF、DOC、DOCX、PPT、PPTX、XLS、XLSX、ZIP、RAR'));
  }
};

// 学生证图片存储（注册时未登录使用）
const studentIdStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, studentIdDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `student-${uniqueSuffix}${ext}`);
  },
});

// 创建multer实例
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const uploadStudentId = multer({
  storage: studentIdStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadFile = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// Multer 错误处理中间件
const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: err.field === 'file' ? '文件大小不能超过限制' : '图片大小不能超过5MB',
        },
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `意外的文件字段: ${err.field}。请使用字段名 'file'`,
        },
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
      },
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
      },
    });
  }
  next();
};

/**
 * 上传图片中间件（带错误处理）
 */
export const uploadImageMiddleware = (req: any, res: any, next: any) => {
  uploadImage.single('file')(req, res, (err: any) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

/**
 * 上传学生证图片（无需登录，供注册使用）
 */
export const uploadStudentIdMiddleware = (req: any, res: any, next: any) => {
  uploadStudentId.single('file')(req, res, (err: any) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

/**
 * 上传文件中间件（带错误处理）
 */
export const uploadFileMiddleware = (req: any, res: any, next: any) => {
  uploadFile.single('file')(req, res, (err: any) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

/**
 * 上传图片
 * POST /api/upload/image
 */
export async function uploadImageHandler(req: Request, res: Response) {
  try {
    if (!req.file) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '请选择要上传的图片');
    }

    // 生成文件URL（开发环境使用本地路径，生产环境应使用OSS URL）
    const fileUrl = `/uploads/images/${req.file.filename}`;

    sendSuccess(res, {
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, '图片上传成功');
  } catch (error: any) {
    console.error('上传图片失败:', error);
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, ErrorCode.VALIDATION_ERROR, '图片大小不能超过5MB');
      }
      return sendError(res, ErrorCode.VALIDATION_ERROR, error.message);
    }
    sendError(res, ErrorCode.INTERNAL_ERROR, '上传图片失败', error.message);
  }
}

/**
 * 上传学生证图片（无需登录）
 * POST /api/upload/student-id
 */
export async function uploadStudentIdHandler(req: Request, res: Response) {
  try {
    if (!req.file) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '请选择学生证照片');
    }
    const fileUrl = `/uploads/images/student-id/${req.file.filename}`;
    sendSuccess(res, {
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, '上传成功');
  } catch (error: any) {
    console.error('上传图片失败:', error);
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, ErrorCode.VALIDATION_ERROR, '图片大小不能超过5MB');
      }
      return sendError(res, ErrorCode.VALIDATION_ERROR, error.message);
    }
    sendError(res, ErrorCode.INTERNAL_ERROR, '上传图片失败', error.message);
  }
}

/**
 * 上传文件
 * POST /api/upload/file
 */
export async function uploadFileHandler(req: Request, res: Response) {
  try {
    if (!req.file) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '请选择要上传的文件');
    }

    // 生成文件URL（开发环境使用本地路径，生产环境应使用OSS URL）
    const fileUrl = `/uploads/files/${req.file.filename}`;

    sendSuccess(res, {
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }, '文件上传成功');
  } catch (error: any) {
    console.error('上传文件失败:', error);
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, ErrorCode.VALIDATION_ERROR, '文件大小不能超过50MB');
      }
      return sendError(res, ErrorCode.VALIDATION_ERROR, error.message);
    }
    sendError(res, ErrorCode.INTERNAL_ERROR, '上传文件失败', error.message);
  }
}
