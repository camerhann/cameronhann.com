import { type Metadata } from 'next'

import { Providers } from '@/app/providers'
import { JsonLd } from '@/components/JsonLd'
import { Layout } from '@/components/Layout'
import { personGraph } from '@/lib/json-ld'
import { person, siteUrl, social } from '@/lib/site'

import '@/styles/tailwind.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s - Chris Cameron-Hann',
    default: 'Chris Cameron-Hann',
  },
  description: person.description,
  authors: [{ name: person.name, url: siteUrl }],
  creator: person.name,
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': `${siteUrl}/feed.xml`,
    },
  },
  openGraph: {
    type: 'profile',
    locale: 'en_GB',
    url: siteUrl,
    siteName: person.name,
    title: 'Chris Cameron-Hann',
    description: person.description,
    images: [
      {
        url: person.imagePath,
        width: 1200,
        height: 1200,
        alt: person.name,
      },
    ],
    firstName: person.givenName,
    lastName: person.familyName,
    username: 'camerhann',
  },
  twitter: {
    card: 'summary_large_image',
    site: social.x.handle,
    creator: social.x.handle,
    title: 'Chris Cameron-Hann',
    description: person.description,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full bg-zinc-50 dark:bg-black">
        <JsonLd data={personGraph()} />
        <Providers>
          <div className="flex w-full">
            <Layout>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
