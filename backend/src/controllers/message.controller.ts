import type { Request, Response } from 'express-serve-static-core';
import { sendSuccess, sendError } from '../utils/response.js';
import { ErrorCode } from '../types/api.js';
import prisma from '../utils/db.js';
import { getParam } from '../utils/params.js';

/**
 * 获取对话列表
 * GET /api/conversations
 */
export async function getConversations(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 获取当前用户发送和接收的所有消息
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        receiver: {
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
    });

    // 构建对话映射：key为对方用户ID，value为对话信息
    const conversationMap = new Map<string, {
      userId: string;
      username: string;
      avatarUrl: string | null;
      lastMessage: {
        content: string;
        createdAt: Date;
      } | null;
      unreadCount: number;
    }>();

    for (const message of messages) {
      // 确定对方用户
      const m = message as any;
      const otherUser = message.senderId === userId ? m.receiver : m.sender;
      const otherUserId = otherUser.id;

      // 如果对话已存在，检查是否需要更新最后一条消息
      if (conversationMap.has(otherUserId)) {
        const conversation = conversationMap.get(otherUserId)!;
        const existingLastMessage = conversation.lastMessage;

        // 如果当前消息更新，更新最后一条消息
        if (!existingLastMessage || message.createdAt > existingLastMessage.createdAt) {
          conversation.lastMessage = {
            content: message.content,
            createdAt: message.createdAt,
          };
        }

        // 如果是接收的消息且未读，增加未读数
        if (message.receiverId === userId && !message.isRead) {
          conversation.unreadCount++;
        }
      } else {
        // 创建新对话
        const unreadCount = message.receiverId === userId && !message.isRead ? 1 : 0;
        conversationMap.set(otherUserId, {
          userId: otherUserId,
          username: otherUser.username,
          avatarUrl: otherUser.avatarUrl,
          lastMessage: {
            content: message.content,
            createdAt: message.createdAt,
          },
          unreadCount,
        });
      }
    }

    // 转换为数组并按最后消息时间排序
    const conversations = Array.from(conversationMap.values()).sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime();
    });

    sendSuccess(res, {
      conversations,
    });
  } catch (error: any) {
    console.error('获取对话列表失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '获取对话列表失败', error.message);
  }
}

/**
 * 获取对话详情（与特定用户的消息列表）
 * GET /api/conversations/:userId
 */
export async function getConversation(req: Request, res: Response) {
  try {
    const otherUserId = getParam(req, 'userId');
    if (!otherUserId) { sendError(res, ErrorCode.INVALID_INPUT, '无效的用户ID'); return; }
    const userId = (req as any).user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 验证对方用户是否存在
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
    });

    if (!otherUser) {
      return sendError(res, ErrorCode.NOT_FOUND, '用户不存在');
    }

    // 获取与对方用户的所有消息
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            {
              senderId: userId,
              receiverId: otherUserId,
            },
            {
              senderId: otherUserId,
              receiverId: userId,
            },
          ],
        },
        include: {
          sender: {
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
      prisma.message.count({
        where: {
          OR: [
            {
              senderId: userId,
              receiverId: otherUserId,
            },
            {
              senderId: otherUserId,
              receiverId: userId,
            },
          ],
        },
      }),
    ]);

    // 格式化消息数据
    const formattedMessages = messages.map((message) => {
      const m = message as any;
      return {
        id: message.id,
        content: message.content,
        imageUrl: message.imageUrl,
        isRead: message.isRead,
        readAt: message.readAt,
        createdAt: message.createdAt,
        sender: {
          id: m.sender.id,
          username: m.sender.username,
          avatarUrl: m.sender.avatarUrl,
        },
        isOwn: message.senderId === userId,
      };
    });

    sendSuccess(res, {
      user: {
        id: otherUser.id,
        username: otherUser.username,
        avatarUrl: otherUser.avatarUrl,
      },
      messages: formattedMessages.reverse(), // 反转顺序，最新的在最后
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
    console.error('获取对话详情失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '获取对话详情失败', error.message);
  }
}

/**
 * 发送消息
 * POST /api/conversations/:userId/messages
 */
export async function sendMessage(req: Request, res: Response) {
  try {
    const receiverId = getParam(req, 'userId');
    if (!receiverId) { sendError(res, ErrorCode.INVALID_INPUT, '无效的用户ID'); return; }
    const { content, imageUrl } = req.body;
    const senderId = (req as any).user?.userId;

    if (!senderId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 验证输入
    if (!content && !imageUrl) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '消息内容或图片不能同时为空');
    }

    if (content && content.length > 5000) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '消息内容不能超过5000字符');
    }

    // 验证接收者是否存在
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return sendError(res, ErrorCode.NOT_FOUND, '接收者不存在');
    }

    if (!receiver.isActive) {
      return sendError(res, ErrorCode.FORBIDDEN, '接收者已被禁用');
    }

    // 不能给自己发消息
    if (senderId === receiverId) {
      return sendError(res, ErrorCode.VALIDATION_ERROR, '不能给自己发消息');
    }

    // 创建消息
    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: content?.trim() || '',
        imageUrl: imageUrl || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    const m = message as any;
    sendSuccess(res, {
      id: message.id,
      content: message.content,
      imageUrl: message.imageUrl,
      isRead: message.isRead,
      createdAt: message.createdAt,
      sender: {
        id: m.sender.id,
        username: m.sender.username,
        avatarUrl: m.sender.avatarUrl,
      },
    }, '消息发送成功', 201);
  } catch (error: any) {
    console.error('发送消息失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '发送消息失败', error.message);
  }
}

/**
 * 标记消息已读
 * PUT /api/messages/:id/read
 */
export async function markMessageAsRead(req: Request, res: Response) {
  try {
    const id = getParam(req, 'id');
    if (!id) { sendError(res, ErrorCode.INVALID_INPUT, '无效的ID'); return; }
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 查找消息
    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      return sendError(res, ErrorCode.NOT_FOUND, '消息不存在');
    }

    // 验证权限（只能标记自己接收的消息）
    if (message.receiverId !== userId) {
      return sendError(res, ErrorCode.FORBIDDEN, '无权标记此消息');
    }

    // 如果已经已读，直接返回
    if (message.isRead) {
      return sendSuccess(res, {
        id: message.id,
        isRead: true,
        readAt: message.readAt,
      }, '消息已标记为已读');
    }

    // 标记为已读
    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    sendSuccess(res, {
      id: updatedMessage.id,
      isRead: updatedMessage.isRead,
      readAt: updatedMessage.readAt,
    }, '消息已标记为已读');
  } catch (error: any) {
    console.error('标记消息已读失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '标记消息已读失败', error.message);
  }
}

/**
 * 获取未读消息数
 * GET /api/messages/unread-count
 */
export async function getUnreadCount(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return sendError(res, ErrorCode.UNAUTHORIZED, '请先登录');
    }

    // 统计未读消息数
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    sendSuccess(res, {
      unreadCount,
    });
  } catch (error: any) {
    console.error('获取未读消息数失败:', error);
    sendError(res, ErrorCode.INTERNAL_ERROR, '获取未读消息数失败', error.message);
  }
}
