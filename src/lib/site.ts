export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cameronhann.com'

export const person = {
  name: 'Chris Cameron-Hann',
  givenName: 'Chris',
  familyName: 'Cameron-Hann',
  alternateNames: ['Christopher Cameron-Hann', 'camerhann'] as const,
  jobTitle: 'Hydrologist',
  tagline: 'CTO, Hydrologist, Flood Modeller, Data Junky, AI nerd',
  description:
    'CTO, hydrologist, flood modeller. Founder of Aegaea, CTO at 7Analytics, World Bank hydrometeorology adviser. Live flood flow predictions from forecast rainfall at forecast.cameronhann.com.',
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

export const works = {
  forecast: {
    href: 'https://forecast.cameronhann.com',
    label: 'forecast.cameronhann.com',
    name: 'Forecast',
  },
} as const
