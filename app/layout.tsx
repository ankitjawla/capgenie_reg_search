import type { Metadata } from 'next';
import './globals.css';
import Toaster from '@/components/Toaster';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  metadataBase: new URL('https://capgenie-reg-search.vercel.app'),
  title: {
    default: 'CapGenie — Bank Regulatory Report Advisor',
    template: '%s · CapGenie',
  },
  description:
    'Enter a bank name. A LangGraph deep agent on Azure OpenAI researches the bank across US / UK / EU / India and maps the profile to applicable regulatory reports.',
  applicationName: 'CapGenie',
  keywords: ['bank regulation', 'compliance', 'reporting', 'FFIEC', 'COREP', 'PRA110', 'RBI', 'AI agent'],
  openGraph: {
    type: 'website',
    title: 'CapGenie — Bank Regulatory Report Advisor',
    description:
      'A LangGraph deep agent that researches a bank and maps it to applicable regulatory reports across US / UK / EU / India.',
    url: 'https://capgenie-reg-search.vercel.app',
    siteName: 'CapGenie',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CapGenie — Bank Regulatory Report Advisor',
    description:
      'A LangGraph deep agent that researches a bank and maps it to applicable regulatory reports.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <SiteHeader />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
