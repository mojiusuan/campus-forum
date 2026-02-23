import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';

/**
 * 获取评论列表
 * GET /api/posts/:postId/comments
 */
export async function getComments(req: Request, res: Response) {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const userId = (req as any).user?.userId; // 获取当前用户ID（如果已登录）

    // 验证帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return sendError(res, ErrorCode.NOT_FOUND, '帖子不存在');
    }

    // 获取顶级评论（parentId为null）
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          postId,
          parentId: null,
          isDeleted: false,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          replies: {
            where: {
              isDeleted: false,
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
            orderBy: {
              createdAt: 'asc',
            },
            take: 10, // 每个顶级评论最多显示10条回复
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.comment.count({
        where: {
          postId,
          parentId: null,
          isDeleted: false,
        },
      }),
    ]);

    // 获取所有评论和回复的ID
    const commentIds = comments.map((c) => c.id);
    const replyIds = comments.flatMap((c) => c.replies.map((r) => r.id));
    const allCommentIds = [...commentIds, ...replyIds];

    // 查询当前用户对这些评论的点赞状态
    const userLikes = userId
      ? await prisma.like.findMany({
          where: {
            userId,
            targetType: 'comment',
            targetId: { in: allCommentIds },
          },
        })
      : [];

    const likedCommentIds = new Set(userLikes.map((like) => like.targetId));

    // 格式化响应数据
    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      userId: comment.userId,
      content: comment.content,
      likeCount: comment.likeCount,
      replyCount: comment.replyCount,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isLiked: likedCommentIds.has(comment.id),
      user: {
        id: comment.user.id,
        username: comment.user.username,
        avatarUrl: comment.user.avatarUrl,
      },
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        userId: reply.userId,
        content: reply.content,
        likeCount: reply.likeCount,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        isLiked: likedCommentIds.has(reply.id),
        user: {
          id: reply.user.id,
          username: reply.user.username,
          avatarUrl: reply.user.avatarUrl,
        },
      })),
    }));

    sendSuccess(res, {
      comments: formattedComments,
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
    console.error('获取评论列表失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '获取评论列表失败', error.message);
  }
}

/**
 * 创建评论
 * POST /api/posts/:postId/comments
 */
export async function createComment(req: Request, res: Response) {
  try {
    const { postId } = req.params;
    const { content, parentId } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 验证输入
    if (!content || content.trim().length === 0) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '评论内容不能为空');
    }

    if (content.length > 5000) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '评论内容不能超过5000字符');
    }

    // 验证帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return sendError(res, ErrorCode.NOT_FOUND, '帖子不存在');
    }

    // 如果parentId存在，验证父评论是否存在
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment || parentComment.postId !== postId) {
        return sendError(res, ErrorCode.NOT_FOUND, '父评论不存在或不属于该帖子');
      }
    }

    // 创建评论
    const comment = await prisma.comment.create({
      data: {
        postId,
        userId,
        parentId: parentId || null,
        content: content.trim(),
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

    // 更新帖子评论数
    await prisma.post.update({
      where: { id: postId },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    });

    // 如果是回复，更新父评论的回复数
    if (parentId) {
      await prisma.comment.update({
        where: { id: parentId },
        data: {
          replyCount: {
            increment: 1,
          },
        },
      });
    }

    sendSuccess(res, {
      id: comment.id,
      content: comment.content,
      likeCount: comment.likeCount,
      replyCount: comment.replyCount,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        avatarUrl: comment.user.avatarUrl,
      },
    }, '评论创建成功', 201);
  } catch (error: any) {
    console.error('创建评论失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '创建评论失败', error.message);
  }
}

/**
 * 更新评论
 * PUT /api/comments/:id
 */
export async function updateComment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 验证输入
    if (!content || content.trim().length === 0) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '评论内容不能为空');
    }

    if (content.length > 5000) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '评论内容不能超过5000字符');
    }

    // 查找评论
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return sendError(res, ErrorCode.NOT_FOUND, '评论不存在');
    }

    if (comment.isDeleted) {
      return sendError(res, ErrorCode.NOT_FOUND, '评论已删除');
    }

    // 验证权限（只能修改自己的评论）
    if (comment.userId !== userId) {
      return sendError(res, ErrorCode.FORBIDDEN, '无权修改此评论');
    }

    // 更新评论
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content: content.trim(),
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
      id: updatedComment.id,
      content: updatedComment.content,
      likeCount: updatedComment.likeCount,
      replyCount: updatedComment.replyCount,
      createdAt: updatedComment.createdAt,
      updatedAt: updatedComment.updatedAt,
      user: {
        id: updatedComment.user.id,
        username: updatedComment.user.username,
        avatarUrl: updatedComment.user.avatarUrl,
      },
    }, '评论更新成功');
  } catch (error: any) {
    console.error('更新评论失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '更新评论失败', error.message);
  }
}

/**
 * 删除评论
 * DELETE /api/comments/:id
 */
export async function deleteComment(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 查找评论
    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        post: true,
      },
    });

    if (!comment) {
      return sendError(res, ErrorCode.NOT_FOUND, '评论不存在');
    }

    if (comment.isDeleted) {
      return sendError(res, ErrorCode.NOT_FOUND, '评论已删除');
    }

    // 验证权限（只能删除自己的评论）
    if (comment.userId !== userId) {
      return sendError(res, ErrorCode.FORBIDDEN, '无权删除此评论');
    }

    // 软删除评论
    await prisma.comment.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // 更新帖子评论数
    await prisma.post.update({
      where: { id: comment.postId },
      data: {
        commentCount: {
          decrement: 1,
        },
      },
    });

    // 如果是回复，更新父评论的回复数
    if (comment.parentId) {
      await prisma.comment.update({
        where: { id: comment.parentId },
        data: {
          replyCount: {
            decrement: 1,
          },
        },
      });
    }

    sendSuccess(res, null, '评论删除成功');
  } catch (error: any) {
    console.error('删除评论失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '删除评论失败', error.message);
  }
}
