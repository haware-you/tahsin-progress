import type { MetadataRoute } from 'next'

// Private school app: only the landing page may be indexed.
// Everything else (login, dashboards, API, previews) is off-limits to crawlers.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/$',
      disallow: '/',
    },
  }
}
