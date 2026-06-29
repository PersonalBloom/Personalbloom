import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'PersonalBloom — Study Smarter',
  description: 'AI-powered study companion with your kawaii mascot Bloomie. Track progress, ace exams, grow every day.',
  keywords: ['study app', 'student planner', 'AI tutor', 'exam prep', 'flashcards'],
  openGraph: {
    title: 'PersonalBloom',
    description: 'Study smarter with Bloomie, your AI study companion',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
