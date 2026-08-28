export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cameronhann.com'

export const person = {
  name: 'Chris Cameron-Hann',
  givenName: 'Chris',
  familyName: 'Cameron-Hann',
  alternateNames: ['Christopher Cameron-Hann', 'camerhann'] as const,
  jobTitle: 'Flood hydrologist',
  description:
    'Flood hydrologist. Founder and CTO of Aegaea, CTO at 7Analytics, and a World Bank hydrometeorology adviser. I build flood models, software, and teams.',
  imagePath: '/images/chris-cameron-hann.jpg',
}

export const social = {
  x: {
    href: 'https://x.com/camerhann',
    handle: '@camerhann',
    label: 'Follow on X',
  },
  github: {
    href: 'https://github.com/camerhann',
    label: 'Follow on GitHub',
  },
  linkedin: {
    href: 'https://www.linkedin.com/in/chris-cameron-hann/',
    label: 'Follow on LinkedIn',
  },
} as const

export const sameAs = [
  social.x.href,
  'https://twitter.com/camerhann',
  social.linkedin.href,
  social.github.href,
  'https://aegaea.com/about-us/team/christopher-cameron-hann/',
] as const
