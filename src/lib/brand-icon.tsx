import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

// Brand mark: Amiri ب in forest green on paper (DESIGN.md tokens).
export async function brandIcon(size: number, radius: number) {
  const amiri = await readFile(join(process.cwd(), 'public/fonts/amiri-regular.ttf'))
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1f5b3a',
          borderRadius: radius,
          color: '#f5f1e6',
          fontFamily: 'Amiri',
          fontSize: size * 0.72,
          lineHeight: 1,
          paddingBottom: size * 0.12,
        }}
      >
        ب
      </div>
    ),
    { width: size, height: size, fonts: [{ name: 'Amiri', data: amiri, style: 'normal', weight: 400 }] }
  )
}
