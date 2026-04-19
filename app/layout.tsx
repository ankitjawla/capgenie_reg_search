import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CapGenie — Bank Regulatory Report Advisor',
  description:
    'Enter a bank name and get the regulatory reports it most likely needs to file across US, UK, EU, and India.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
