/**
 * 加载骨架屏组件
 */

// 帖子卡片骨架屏
export function PostCardSkeleton() {
  return (
    <div className="p-6 border-b border-gray-200 animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <div className="h-5 w-20 bg-gray-200 rounded"></div>
            <div className="h-5 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-full bg-gray-200 rounded mb-1"></div>
          <div className="h-4 w-5/6 bg-gray-200 rounded mb-3"></div>
          <div className="flex items-center space-x-6">
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 评论骨架屏
export function CommentSkeleton() {
  return (
    <div className="border-b border-gray-200 pb-4 animate-pulse">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-full bg-gray-200 rounded mb-1"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

// 列表骨架屏
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </>
  );
}
