/**
 * 图片画廊组件 - 支持智能布局和灯箱预览
 */
import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getFullUrl } from '../utils/url';
import LazyImage from './LazyImage';

interface ImageGalleryProps {
  images: string[];
  alt?: string;
  className?: string;
}

export default function ImageGallery({ images, alt = '图片', className = '' }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden'; // 防止背景滚动
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // 键盘事件处理
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, images.length]);

  // 根据图片数量选择布局
  const getLayoutClass = () => {
    const count = images.length;
    if (count === 1) {
      return 'grid-cols-1';
    } else if (count === 2) {
      return 'grid-cols-2';
    } else if (count === 3) {
      return 'grid-cols-3';
    } else if (count === 4) {
      return 'grid-cols-2';
    } else {
      return 'grid-cols-3';
    }
  };

  // 渲染图片网格
  const renderImageGrid = () => {
    const count = images.length;
    
    if (count === 1) {
      // 单张图片：大图显示
      return (
        <div className="w-full">
          <img
            src={getFullUrl(images[0]) || ''}
            alt={`${alt} - 1`}
            className="w-full h-auto rounded-lg cursor-pointer object-cover max-h-[600px]"
            onClick={() => openLightbox(0)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14"%3E图片加载失败%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
      );
    } else if (count === 2) {
      // 两张图片：横向排列
      return (
        <div className="grid grid-cols-2 gap-2">
          {images.map((url, index) => (
            <img
              key={index}
              src={getFullUrl(url) || ''}
              alt={`${alt} - ${index + 1}`}
              className="w-full h-64 rounded-lg cursor-pointer object-cover hover:opacity-90 transition-opacity"
              onClick={() => openLightbox(index)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14"%3E图片加载失败%3C/text%3E%3C/svg%3E';
              }}
            />
          ))}
        </div>
      );
    } else if (count === 3) {
      // 三张图片：左侧一张大图，右侧两张小图
      return (
        <div className="grid grid-cols-3 gap-2 h-64">
          <div className="col-span-1">
            <img
              src={getFullUrl(images[0]) || ''}
              alt={`${alt} - 1`}
              className="w-full h-full rounded-lg cursor-pointer object-cover hover:opacity-90 transition-opacity"
              onClick={() => openLightbox(0)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14"%3E图片加载失败%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
          <div className="col-span-2 grid grid-rows-2 gap-2">
            {images.slice(1).map((url, index) => (
              <img
                key={index + 1}
                src={getFullUrl(url) || ''}
                alt={`${alt} - ${index + 2}`}
                className="w-full h-full rounded-lg cursor-pointer object-cover hover:opacity-90 transition-opacity"
                onClick={() => openLightbox(index + 1)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14"%3E图片加载失败%3C/text%3E%3C/svg%3E';
                }}
              />
            ))}
          </div>
        </div>
      );
    } else if (count === 4) {
      // 四张图片：2x2网格
      return (
        <div className="grid grid-cols-2 gap-2">
          {images.map((url, index) => (
            <img
              key={index}
              src={getFullUrl(url) || ''}
              alt={`${alt} - ${index + 1}`}
              className="w-full h-48 rounded-lg cursor-pointer object-cover hover:opacity-90 transition-opacity"
              onClick={() => openLightbox(index)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14"%3E图片加载失败%3C/text%3E%3C/svg%3E';
              }}
            />
          ))}
        </div>
      );
    } else {
      // 5张及以上：3列网格，最后一张显示"更多"遮罩
      return (
        <div className="grid grid-cols-3 gap-2">
          {images.slice(0, 5).map((url, index) => (
            <div key={index} className="relative">
              <img
                src={getFullUrl(url) || ''}
                alt={`${alt} - ${index + 1}`}
                className={`w-full h-32 rounded-lg cursor-pointer object-cover hover:opacity-90 transition-opacity ${
                  index === 4 && images.length > 5 ? 'opacity-75' : ''
                }`}
                onClick={() => openLightbox(index)}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14"%3E图片加载失败%3C/text%3E%3C/svg%3E';
                }}
              />
              {index === 4 && images.length > 5 && (
                <div
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center text-white font-semibold cursor-pointer"
                  onClick={() => openLightbox(4)}
                >
                  +{images.length - 5}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <>
      <div className={className}>{renderImageGrid()}</div>

      {/* 灯箱预览 */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* 关闭按钮 */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="关闭"
          >
            <X className="w-8 h-8" />
          </button>

          {/* 上一张按钮 */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
              aria-label="上一张"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
          )}

          {/* 图片 */}
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <img
              src={getFullUrl(images[currentIndex]) || ''}
              alt={`${alt} - ${currentIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="14"%3E图片加载失败%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>

          {/* 下一张按钮 */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10"
              aria-label="下一张"
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          )}

          {/* 图片计数 */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
