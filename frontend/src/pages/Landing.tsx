/**
 * 展示页：站点入口，酷炫简约 + 视频/动画背景 + 霓虹悬浮文字 + 进入论坛按钮
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  const [videoReady, setVideoReady] = useState(false);
  return (
    <div className="landing-page">
      {/* 背景：fallback 为 CSS 动画；若在 public 下放置 landing-bg.mp4 则显示视频 */}
      <div className="landing-bg">
        <div className="landing-bg-fallback" aria-hidden="true" />
        <video
          className={`landing-video ${videoReady ? 'landing-video-visible' : ''}`}
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setVideoReady(true)}
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%230f0f23' width='1920' height='1080'/%3E%3C/svg%3E"
        >
          <source src="/landing-bg.mp4" type="video/mp4" />
        </video>
      </div>

      {/* 内容层 */}
      <div className="landing-content">
        <h1 className="landing-title">
          <span className="landing-title-text">在这里，说出你的故事</span>
        </h1>
        <p className="landing-subtitle">校园论坛 · 连接每一个声音</p>
        <Link to="/forum" className="landing-btn">
          进入论坛
        </Link>
      </div>

      {/* 备案号（首页底部） */}
      <footer className="landing-footer">
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="landing-icp"
        >
          陕ICP备2026003916号
        </a>
      </footer>

      <style>{`
        .landing-page {
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .landing-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .landing-video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 0.8s ease;
        }
        .landing-video.landing-video-visible {
          opacity: 1;
        }

        .landing-bg-fallback {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%);
          animation: landingGradient 12s ease infinite;
        }

        @keyframes landingGradient {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.95; transform: scale(1.02); }
        }

        .landing-bg-fallback::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 50% at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%);
          pointer-events: none;
        }

        .landing-content {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 2rem;
          max-width: 640px;
        }

        .landing-title {
          margin: 0 0 1rem;
          font-size: clamp(1.75rem, 5vw, 2.5rem);
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .landing-title-text {
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
          transition: text-shadow 0.3s ease, color 0.3s ease;
          cursor: default;
          display: inline-block;
          padding: 0.2em 0;
        }

        .landing-title-text:hover {
          color: #fff;
          text-shadow:
            0 0 10px #818cf8,
            0 0 20px #6366f1,
            0 0 40px #4f46e5,
            0 0 80px #4338ca;
        }

        .landing-subtitle {
          margin: 0 0 2.5rem;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .landing-btn {
          display: inline-block;
          padding: 0.875rem 2.5rem;
          font-size: 1rem;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border: none;
          border-radius: 9999px;
          text-decoration: none;
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.4);
          transition: transform 0.2s ease, box-shadow 0.3s ease;
        }

        .landing-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 40px rgba(99, 102, 241, 0.6);
        }

        .landing-footer {
          position: absolute;
          bottom: 1rem;
          left: 0;
          right: 0;
          z-index: 1;
          text-align: center;
        }
        .landing-icp {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
        }
        .landing-icp:hover {
          color: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
}
