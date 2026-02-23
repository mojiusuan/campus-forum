/**
 * 帖子列表图片预览组件
 */
import { Link } from 'react-router-dom';
import { getFullUrl } from '../utils/url';
import LazyImage from './LazyImage';

interface PostImagePreviewProps {
  images: string[];
  postId: string;
  maxImages?: number;
}

export default function PostImagePreview({
  images,
  postId,
  maxImages = 3,
}: PostImagePreviewProps) {
  if (!images || images.length === 0) return null;

  const displayImages = images.slice(0, maxImages);
  const remainingCount = images.length - maxImages;

  // 单张图片：显示较大缩略图
  if (images.length === 1) {
    return (
      <Link to={`/posts/${postId}`} className="block mt-3">
        <LazyImage
          src={getFullUrl(images[0])}
          alt="帖子图片"
          className="w-full h-48 rounded-lg object-cover hover:opacity-90 transition-opacity"
        />
      </Link>
    );
  }

  // 多张图片：网格布局
  return (
    <Link to={`/posts/${postId}`} className="block mt-3">
      <div className={`grid gap-1 ${displayImages.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {displayImages.map((url, index) => (
          <div key={index} className="relative">
            <LazyImage
              src={getFullUrl(url)}
              alt={`帖子图片 ${index + 1}`}
              className={`w-full rounded-lg object-cover hover:opacity-90 transition-opacity ${
                displayImages.length === 2 ? 'h-32' : 'h-24'
              }`}
            />
            {index === maxImages - 1 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                +{remainingCount}
              </div>
            )}
          </div>
        ))}
      </div>
    </Link>
  );
}
