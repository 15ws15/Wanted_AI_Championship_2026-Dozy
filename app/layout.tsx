import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dozy',
  description: '시작하기 어려운 할 일을, 지금 할 수 있는 한 가지 행동으로.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
