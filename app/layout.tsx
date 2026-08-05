import './globals.css';
import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'إثبات الحضور | نظام حضور وانصراف الموظفين',
  description: 'نظام إلكتروني لتسجيل حضور وانصراف الموظفين',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <body className={`${cairo.className} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
