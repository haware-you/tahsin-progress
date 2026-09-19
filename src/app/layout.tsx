import type { Metadata } from "next"
import { Montserrat, EB_Garamond, Amiri } from "next/font/google"
import "./globals.css"

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
})

const garamond = EB_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
})

const amiri = Amiri({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  title: "Al Bayyinah — Sistem Progres Tahsin",
  description: "Sistem pelacakan progres belajar Al-Quran Al Bayyinah School",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${montserrat.variable} ${garamond.variable} ${amiri.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 antialiased font-sans">
        {children}
      </body>
    </html>
  )
}
