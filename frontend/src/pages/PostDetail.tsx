/**
 * 帖子详情页
 */
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../api/posts';
import { commentsApi } from '../api/comments';
import { interactionsApi } from '../api/interactions';
import { useAuthStore } from '../store/authStore';
import { getFullUrl } from '../utils/url';
import { useState } from 'react';
import {
  MessageSquare,
  Eye,
  Heart,
  Clock,
  User,
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  Star,
} from 'lucide-react';
import ImageGallery from '../components/ImageGallery';
import { CommentSkeleton } from '../components/LoadingSkeleton';
import type { Post, Comment } from '../types/api';
import type { UseMutationResult } from '@tanstack/react-query';

// 回复项组件
function ReplyItem({
  reply,
  isAuthenticated,
  navigate,
  queryClient,
  postId,
}: {
  reply: Comment;
  isAuthenticated: boolean;
  navigate: any;
  queryClient: any;
  postId: string;
}) {
  // 回复点赞功能
  const likeReplyMutation = useMutation({
    mutationFn: async () => {
      if (reply.isLiked) {
        return interactionsApi.unlikeComment(reply.id);
      } else {
        return interactionsApi.likeComment(reply.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const handleLikeReply = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    likeReplyMutation.mutate();
  };

  return (
    <div className="flex items-start space-x-2">
      {reply.user?.avatarUrl ? (
        <img
          src={getFullUrl(reply.user.avatarUrl) || ''}
          alt={reply.user.username}
          className="w-8 h-8 rounded-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <User className="w-4 h-4 text-gray-600" />
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm font-medium text-gray-900">
            {reply.user?.username || '匿名'}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(reply.createdAt).toLocaleString()}
          </span>
        </div>
        <p className="text-sm text-gray-700 mb-2">{reply.content}</p>
        <button
          onClick={handleLikeReply}
          disabled={likeReplyMutation.isPending}
          className={`text-xs hover:text-blue-600 transition-colors flex items-center space-x-1 disabled:opacity-50 ${
            reply.isLiked ? 'text-red-600' : 'text-gray-500'
          }`}
        >
          <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
          <span>{reply.likeCount}</span>
        </button>
      </div>
    </div>
  );
}

// 评论项组件
function CommentItem({
  comment,
  isAuthenticated,
  currentUser,
  navigate,
  queryClient,
  postId,
  replyContents,
  setReplyContents,
  createCommentMutation,
}: {
  comment: Comment;
  isAuthenticated: boolean;
  currentUser: any;
  navigate: any;
  queryClient: any;
  postId: string;
  replyContents: Record<string, string>;
  setReplyContents: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  createCommentMutation: UseMutationResult<any, any, { content: string; parentId?: string }, any>;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  // 评论点赞功能
  const likeCommentMutation = useMutation({
    mutationFn: async () => {
      if (comment.isLiked) {
        return interactionsApi.unlikeComment(comment.id);
      } else {
        return interactionsApi.likeComment(comment.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const handleLikeComment = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    likeCommentMutation.mutate();
  };

  // 评论编辑功能
  const updateCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return commentsApi.updateComment(comment.id, { content });
    },
    onSuccess: () => {
      setIsEditing(false);
      setEditContent(comment.content);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditContent(comment.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    updateCommentMutation.mutate(editContent);
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    const content = replyContents[comment.id];
    if (!content?.trim() || !isAuthenticated) return;
    createCommentMutation.mutate({
      content,
      parentId: comment.id,
    });
    setReplyContents((prev) => {
      const newContents = { ...prev };
      delete newContents[comment.id];
      return newContents;
    });
    setShowReplyForm(false);
  };

  return (
    <div className="border-b border-gray-200 pb-4 last:border-0">
      <div className="flex items-start space-x-3">
        {comment.user?.avatarUrl ? (
          <img
            src={getFullUrl(comment.user.avatarUrl) || ''}
            alt={comment.user.username}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
            <User className="w-6 h-6 text-gray-600" />
          </div>
        )}
        <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {comment.user?.username || '匿名'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {isEditing ? (
                      <form onSubmit={handleSaveEdit} className="mb-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex items-center justify-end space-x-2 mt-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                          >
                            取消
                          </button>
                          <button
                            type="submit"
                            disabled={!editContent.trim() || updateCommentMutation.isPending}
                            className="px-4 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {updateCommentMutation.isPending ? '保存中...' : '保存'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-gray-700 mb-2">{comment.content}</p>
                    )}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <button
              onClick={handleLikeComment}
              disabled={likeCommentMutation.isPending}
              className={`hover:text-blue-600 transition-colors flex items-center space-x-1 disabled:opacity-50 ${
                comment.isLiked ? 'text-red-600' : ''
              }`}
            >
              <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
              <span>{comment.likeCount}</span>
            </button>
            {isAuthenticated && (
              <>
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="hover:text-blue-600 transition-colors"
                >
                  回复
                </button>
                          {comment.userId === currentUser?.id && (
                            <>
                              <button
                                onClick={handleStartEdit}
                                disabled={isEditing}
                                className="hover:text-blue-600 transition-colors disabled:opacity-50"
                              >
                                编辑
                              </button>
                    <button
                      onClick={async () => {
                        if (confirm('确定要删除这条评论吗？')) {
                          try {
                            await commentsApi.deleteComment(comment.id);
                            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
                            queryClient.invalidateQueries({ queryKey: ['post', postId] });
                          } catch (error) {
                            console.error('删除失败:', error);
                          }
                        }
                      }}
                      className="hover:text-red-600 transition-colors"
                    >
                      删除
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* 回复表单 */}
          {showReplyForm && isAuthenticated && (
            <form onSubmit={handleSubmitReply} className="mt-3">
              <textarea
                value={replyContents[comment.id] || ''}
                onChange={(e) =>
                  setReplyContents((prev) => ({
                    ...prev,
                    [comment.id]: e.target.value,
                  }))
                }
                placeholder={`回复 @${comment.user?.username || '匿名'}...`}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                rows={3}
              />
              <div className="flex items-center justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContents((prev) => {
                      const newContents = { ...prev };
                      delete newContents[comment.id];
                      return newContents;
                    });
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={
                    !replyContents[comment.id]?.trim() || createCommentMutation.isPending
                  }
                  className="px-4 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <Send className="w-3 h-3" />
                  <span>回复</span>
                </button>
              </div>
            </form>
          )}

          {/* 嵌套回复列表 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-200 space-y-3">
              {comment.replies.map((reply) => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  isAuthenticated={isAuthenticated}
                  navigate={navigate}
                  queryClient={queryClient}
                  postId={postId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContents, setReplyContents] = useState<Record<string, string>>({});

  // 获取帖子详情
  const { data: postData, isLoading: postLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      if (!id) throw new Error('Post ID is required');
      const response = await postsApi.getPostById(id);
      return response.data;
    },
    enabled: !!id,
  });

  // 获取评论列表
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      if (!id) throw new Error('Post ID is required');
      const response = await commentsApi.getComments(id);
      return response.data?.comments || [];
    },
    enabled: !!id,
  });

  // 创建评论
  const createCommentMutation = useMutation({
    mutationFn: async (data: { content: string; parentId?: string }) => {
      if (!id) throw new Error('Post ID is required');
      return commentsApi.createComment(id, {
        content: data.content,
        parentId: data.parentId,
      });
    },
    onSuccess: () => {
      setCommentContent('');
      setReplyingTo(null);
      setReplyContents({});
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !isAuthenticated) return;
    createCommentMutation.mutate({
      content: commentContent,
      parentId: replyingTo || undefined,
    });
  };

  // 点赞/取消点赞
  const likePostMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Post ID is required');
      if (post?.isLiked) {
        return interactionsApi.unlikePost(id);
      } else {
        return interactionsApi.likePost(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // 收藏/取消收藏
  const favoritePostMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('Post ID is required');
      if (post?.isFavorited) {
        return interactionsApi.unfavoritePost(id);
      } else {
        return interactionsApi.favoritePost(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    likePostMutation.mutate();
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    favoritePostMutation.mutate();
  };

  const post = postData as Post | undefined;
  const comments = (commentsData || []) as Comment[];

  if (postLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">帖子不存在</p>
        <Link to="/" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          返回首页
        </Link>
      </div>
    );
  }

  const isAuthor = user?.id === post.userId;

  return (
    <div className="max-w-4xl mx-auto">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        返回
      </button>

      {/* 帖子内容 */}
      <article className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {post.category && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {post.category.name}
                </span>
              )}
              {post.isPinned && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  置顶
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
          </div>
          {isAuthor && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate(`/posts/${id}/edit`)}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                title="编辑"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={async () => {
                  if (confirm('确定要删除这篇帖子吗？')) {
                    try {
                      await postsApi.deletePost(id!);
                      navigate('/');
                    } catch (error) {
                      console.error('删除失败:', error);
                    }
                  }
                }}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                title="删除"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
        </div>

        {post.images && post.images.length > 0 && (
          <div className="mb-6">
            <ImageGallery images={post.images} alt={post.title} />
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <Link
              to={`/users/${post.userId}`}
              className="flex items-center space-x-2 hover:text-blue-600 transition-colors"
            >
              {post.user?.avatarUrl ? (
                <img
                  src={getFullUrl(post.user.avatarUrl) || ''}
                  alt={post.user.username}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <span>{post.user?.username || '匿名'}</span>
            </Link>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{new Date(post.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{post.viewCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="w-4 h-4" />
              <span>{post.commentCount}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={likePostMutation.isPending}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                post.isLiked
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
              <span>{post.likeCount}</span>
            </button>
            <button
              onClick={handleFavorite}
              disabled={favoritePostMutation.isPending}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                post.isFavorited
                  ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              <Star className={`w-4 h-4 ${post.isFavorited ? 'fill-current' : ''}`} />
              <span>收藏</span>
            </button>
          </div>
        </div>
      </article>

      {/* 评论区域 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          评论 ({comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0)})
        </h2>

        {/* 发表评论 */}
        {isAuthenticated ? (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={replyingTo ? '回复评论...' : '发表你的看法...'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
            />
            <div className="flex items-center justify-between mt-2">
              {replyingTo && (
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  取消回复
                </button>
              )}
              <button
                type="submit"
                disabled={!commentContent.trim() || createCommentMutation.isPending}
                className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>发表</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-gray-600 mb-2">请先登录后发表评论</p>
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              立即登录
            </Link>
          </div>
        )}

        {/* 评论列表 */}
        {commentsLoading ? (
          <div className="space-y-4 py-4">
            <CommentSkeleton />
            <CommentSkeleton />
            <CommentSkeleton />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">暂无评论</div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isAuthenticated={isAuthenticated}
                currentUser={user}
                navigate={navigate}
                queryClient={queryClient}
                postId={id!}
                replyContents={replyContents}
                setReplyContents={setReplyContents}
                createCommentMutation={createCommentMutation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
