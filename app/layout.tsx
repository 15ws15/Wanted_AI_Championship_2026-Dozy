import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dozy',
  description: '시작하기 어려운 일을, 지금 할 수 있는 한 가지로.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 한글 웹폰트는 글리프가 많아 유니코드 구간별로 쪼개 배포된다.
            구글이 그 분할본을 서빙하므로 실제로 쓰는 구간만 내려받는다.
            next/font로 전부 self-host하면 쓰지도 않는 한자·옛한글까지 번들에 들어간다. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600&family=IBM+Plex+Serif:wght@500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
