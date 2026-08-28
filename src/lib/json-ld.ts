import { person, sameAs, siteUrl, social } from '@/lib/site'

export function personGraph() {
  const imageUrl = `${siteUrl}${person.imagePath}`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: siteUrl,
        name: person.name,
        description: person.description,
        inLanguage: 'en-GB',
        publisher: { '@id': `${siteUrl}/#person` },
        author: { '@id': `${siteUrl}/#person` },
      },
      {
        '@type': 'Person',
        '@id': `${siteUrl}/#person`,
        name: person.name,
        givenName: person.givenName,
        familyName: person.familyName,
        alternateName: [...person.alternateNames],
        url: siteUrl,
        image: {
          '@type': 'ImageObject',
          url: imageUrl,
          caption: person.name,
        },
        jobTitle: person.jobTitle,
        description: person.description,
        knowsAbout: [
          'Flood hydrology',
          'Flood modelling',
          'Flood forecasting',
          'Flood Estimation Handbook',
          'UK flood risk',
          'Hydrometeorology',
          'Climate resilience',
        ],
        alumniOf: {
          '@type': 'CollegeOrUniversity',
          name: 'University of Bristol',
          url: 'https://www.bristol.ac.uk',
        },
        worksFor: [
          {
            '@type': 'Organization',
            name: 'Aegaea',
            url: 'https://aegaea.com',
          },
          {
            '@type': 'Organization',
            name: '7Analytics',
            url: 'https://7analytics.ai',
          },
        ],
        sameAs: [...sameAs],
        identifier: [
          {
            '@type': 'PropertyValue',
            propertyID: 'X',
            value: social.x.handle,
          },
          {
            '@type': 'PropertyValue',
            propertyID: 'LinkedIn',
            value: 'chris-cameron-hann',
          },
        ],
      },
    ],
  }
}

export function profilePageGraph() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${siteUrl}/about#profile`,
    url: `${siteUrl}/about`,
    name: `${person.name} — about`,
    mainEntity: { '@id': `${siteUrl}/#person` },
    about: { '@id': `${siteUrl}/#person` },
  }
}

export function articleGraph({
  title,
  description,
  date,
  path,
  image,
}: {
  title: string
  description: string
  date: string
  path: string
  image?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    datePublished: date,
    dateModified: date,
    inLanguage: 'en-GB',
    url: `${siteUrl}${path}`,
    mainEntityOfPage: `${siteUrl}${path}`,
    image: image ? `${siteUrl}${image}` : `${siteUrl}${person.imagePath}`,
    author: { '@id': `${siteUrl}/#person` },
    publisher: { '@id': `${siteUrl}/#person` },
    creator: { '@id': `${siteUrl}/#person` },
  }
}
