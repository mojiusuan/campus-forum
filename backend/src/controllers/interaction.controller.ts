import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';

/**
 * 点赞帖子
 * POST /api/posts/:id/like
 */
export async function likePost(req: Request, res: Response) {
  try {
    const { id: postId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 验证帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return sendError(res, ErrorCode.NOT_FOUND, '帖子不存在');
    }

    if (post.isDeleted) {
      return sendError(res, ErrorCode.NOT_FOUND, '帖子已删除');
    }

    // 检查是否已点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: 'post',
          targetId: postId,
        },
      },
    });

    if (existingLike) {
      return sendError(res, ErrorCode.ALREADY_EXISTS, '已经点赞过了');
    }

    // 创建点赞记录
    await prisma.like.create({
      data: {
        userId,
        targetType: 'post',
        targetId: postId,
      },
    });

    // 更新帖子点赞数
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    });

    sendSuccess(res, {
      isLiked: true,
      likeCount: updatedPost.likeCount,
    }, '点赞成功');
  } catch (error: any) {
    console.error('点赞帖子失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '点赞失败', error.message);
  }
}

/**
 * 取消点赞帖子
 * DELETE /api/posts/:id/like
 */
export async function unlikePost(req: Request, res: Response) {
  try {
    const { id: postId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 验证帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return sendError(res, ErrorCode.NOT_FOUND, '帖子不存在');
    }

    // 检查是否已点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: 'post',
          targetId: postId,
        },
      },
    });

    if (!existingLike) {
      return sendError(res, ErrorCode.NOT_FOUND, '还没有点赞');
    }

    // 删除点赞记录
    await prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });

    // 更新帖子点赞数
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        likeCount: {
          decrement: 1,
        },
      },
    });

    sendSuccess(res, {
      isLiked: false,
      likeCount: updatedPost.likeCount,
    }, '取消点赞成功');
  } catch (error: any) {
    console.error('取消点赞失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '取消点赞失败', error.message);
  }
}

/**
 * 点赞评论
 * POST /api/comments/:id/like
 */
export async function likeComment(req: Request, res: Response) {
  try {
    const { id: commentId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 验证评论是否存在
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return sendError(res, ErrorCode.NOT_FOUND, '评论不存在');
    }

    if (comment.isDeleted) {
      return sendError(res, ErrorCode.NOT_FOUND, '评论已删除');
    }

    // 检查是否已点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: 'comment',
          targetId: commentId,
        },
      },
    });

    if (existingLike) {
      return sendError(res, ErrorCode.ALREADY_EXISTS, '已经点赞过了');
    }

    // 创建点赞记录
    await prisma.like.create({
      data: {
        userId,
        targetType: 'comment',
        targetId: commentId,
      },
    });

    // 更新评论点赞数
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        likeCount: {
          increment: 1,
        },
      },
    });

    sendSuccess(res, {
      isLiked: true,
      likeCount: updatedComment.likeCount,
    }, '点赞成功');
  } catch (error: any) {
    console.error('点赞评论失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '点赞失败', error.message);
  }
}

/**
 * 取消点赞评论
 * DELETE /api/comments/:id/like
 */
export async function unlikeComment(req: Request, res: Response) {
  try {
    const { id: commentId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 验证评论是否存在
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return sendError(res, ErrorCode.NOT_FOUND, '评论不存在');
    }

    // 检查是否已点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: 'comment',
          targetId: commentId,
        },
      },
    });

    if (!existingLike) {
      return sendError(res, ErrorCode.NOT_FOUND, '还没有点赞');
    }

    // 删除点赞记录
    await prisma.like.delete({
      where: {
        id: existingLike.id,
      },
    });

    // 更新评论点赞数
    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        likeCount: {
          decrement: 1,
        },
      },
    });

    sendSuccess(res, {
      isLiked: false,
      likeCount: updatedComment.likeCount,
    }, '取消点赞成功');
  } catch (error: any) {
    console.error('取消点赞评论失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '取消点赞失败', error.message);
  }
}

/**
 * 收藏帖子
 * POST /api/posts/:id/favorite
 */
export async function favoritePost(req: Request, res: Response) {
  try {
    const { id: postId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 验证帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return sendError(res, ErrorCode.NOT_FOUND, '帖子不存在');
    }

    if (post.isDeleted) {
      return sendError(res, ErrorCode.NOT_FOUND, '帖子已删除');
    }

    // 检查是否已收藏
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingFavorite) {
      return sendError(res, ErrorCode.ALREADY_EXISTS, '已经收藏过了');
    }

    // 创建收藏记录
    await prisma.favorite.create({
      data: {
        userId,
        postId,
      },
    });

    // 更新帖子收藏数
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        favoriteCount: {
          increment: 1,
        },
      },
    });

    sendSuccess(res, {
      isFavorited: true,
      favoriteCount: updatedPost.favoriteCount,
    }, '收藏成功');
  } catch (error: any) {
    console.error('收藏帖子失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '收藏失败', error.message);
  }
}

/**
 * 取消收藏帖子
 * DELETE /api/posts/:id/favorite
 */
export async function unfavoritePost(req: Request, res: Response) {
  try {
    const { id: postId } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 验证帖子是否存在
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return sendError(res, ErrorCode.NOT_FOUND, '帖子不存在');
    }

    // 检查是否已收藏
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!existingFavorite) {
      return sendError(res, ErrorCode.NOT_FOUND, '还没有收藏');
    }

    // 删除收藏记录
    await prisma.favorite.delete({
      where: {
        id: existingFavorite.id,
      },
    });

    // 更新帖子收藏数
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        favoriteCount: {
          decrement: 1,
        },
      },
    });

    sendSuccess(res, {
      isFavorited: false,
      favoriteCount: updatedPost.favoriteCount,
    }, '取消收藏成功');
  } catch (error: any) {
    console.error('取消收藏失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '取消收藏失败', error.message);
  }
}
