import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Music Player',
  description: 'Play your local audio files',
  manifest: '/manifest.json',
  themeColor: '#1a1a2e',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Music Player'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
