import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import '@/app/globals.css'

import { ThemeProvider } from '@/components/theme-provider'
import { SidebarConfigProvider } from '@/contexts/sidebar-context'
import { Toaster } from '@/components/ui/toast'
import { inter } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'ShadcnStore - Modern Admin Dashboard Template',
  description:
    'A beautiful and comprehensive admin dashboard template built with React, Next.js, TypeScript, and shadcn/ui. Perfect for building modern web applications.',
  keywords: [
    'admin dashboard',
    'react',
    'nextjs',
    'typescript',
    'shadcn/ui',
    'tailwind css',
  ],
  openGraph: {
    title: 'ShadcnStore - Modern Admin Dashboard Template',
    description:
      'A beautiful and comprehensive admin dashboard template built with React, Next.js, TypeScript, and shadcn/ui.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShadcnStore - Modern Admin Dashboard Template',
    description:
      'A beautiful and comprehensive admin dashboard template built with React, Next.js, TypeScript, and shadcn/ui.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn(inter.variable, 'antialiased')}>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="nextjs-ui-theme">
          <SidebarConfigProvider>
            <Toaster>{children}</Toaster>
          </SidebarConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
