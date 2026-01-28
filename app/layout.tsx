import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WebGL Benchmark',
  description: 'GPU performance testing with Three.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
