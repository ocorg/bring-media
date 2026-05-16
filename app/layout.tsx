import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BRING Media Terminal',
  description: 'Internal operations platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}