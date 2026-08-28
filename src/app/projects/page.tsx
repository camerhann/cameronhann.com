import { type Metadata } from 'next'
import Image from 'next/image'

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import logo7analytics from '@/images/logos/7analytics.svg'
import logoAegaea from '@/images/logos/aegaea.svg'
import logoForecast from '@/images/logos/forecast.svg'
import logoHydrometric from '@/images/logos/hydrometric.svg'
import logoWorldBank from '@/images/logos/world-bank.svg'
import { works } from '@/lib/site'

const projects = [
  {
    name: works.forecast.name,
    description:
      'Live flood flow predictions for England and Wales, from forecast rainfall. Experimental river-flow outlook — not a flood warning service.',
    link: { href: works.forecast.href, label: works.forecast.label },
    logo: logoForecast,
  },
  {
    name: 'Aegaea',
    description:
      'Flood risk consultancy I founded in 2012. Modelling, drainage, planning — and a team that can issue without me in the loop. I am founder and CTO.',
    link: { href: 'https://aegaea.com', label: 'aegaea.com' },
    logo: logoAegaea,
  },
  {
    name: '7Analytics',
    description:
      'Flood data for insurers and asset owners, at building scale, trained on claims. I joined in 2024 and I am CTO.',
    link: { href: 'https://7analytics.ai', label: '7analytics.ai' },
    logo: logo7analytics,
  },
  {
    name: 'World Bank',
    description:
      'Hydrometeorology advice since 2020: observation networks, flood forecasting, and the service that has to run. Named hydrological consultant on Sri Lanka’s Climate Resilience programme.',
    link: {
      href: 'https://aegaea.com/about-us/news/aegaea-director-appointed-to-world-bank-group/',
      label: 'World Bank hydrology group',
    },
    logo: logoWorldBank,
  },
  {
    name: 'Hydrometric',
    description:
      'UK flood hydrology in the browser. The FEH statistical pathway without WINFAP, the crash, and the Excel round-trip. I build it.',
    link: { href: 'https://hydrometric.io', label: 'hydrometric.io' },
    logo: logoHydrometric,
  },
]

function LinkIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        d="M15.712 11.823a.75.75 0 1 0 1.06 1.06l-1.06-1.06Zm-4.95 1.768a.75.75 0 0 0 1.06-1.06l-1.06 1.06Zm-2.475-1.414a.75.75 0 1 0-1.06-1.06l1.06 1.06Zm4.95-1.768a.75.75 0 1 0-1.06 1.06l1.06-1.06Zm3.359.53-.884.884 1.06 1.06.885-.883-1.061-1.06Zm-4.95-2.12 1.414-1.415L12 6.344l-1.415 1.413 1.061 1.061Zm0 3.535a2.5 2.5 0 0 1 0-3.536l-1.06-1.06a4 4 0 0 0 0 5.656l1.06-1.06Zm4.95-4.95a2.5 2.5 0 0 1 0 3.535L17.656 12a4 4 0 0 0 0-5.657l-1.06 1.06Zm1.06-1.06a4 4 0 0 0-5.656 0l1.06 1.06a2.5 2.5 0 0 1 3.536 0l1.06-1.06Zm-7.07 7.07.176.177 1.06-1.06-.176-.177-1.06 1.06Zm-3.183-.353.884-.884-1.06-1.06-.884.883 1.06 1.06Zm4.95 2.121-1.414 1.414 1.06 1.06 1.415-1.413-1.06-1.061Zm0-3.536a2.5 2.5 0 0 1 0 3.536l1.06 1.06a4 4 0 0 0 0-5.656l-1.06 1.06Zm-4.95 4.95a2.5 2.5 0 0 1 0-3.535L6.344 12a4 4 0 0 0 0 5.656l1.06-1.06Zm-1.06 1.06a4 4 0 0 0 5.657 0l-1.061-1.06a2.5 2.5 0 0 1-3.535 0l-1.061 1.06Zm7.07-7.07-.176-.177-1.06 1.06.176.178 1.06-1.061Z"
        fill="currentColor"
      />
    </svg>
  )
}

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Live flood flow predictions at forecast.cameronhann.com, plus Aegaea, 7Analytics, World Bank hydrometeorology advice, and Hydrometric.',
  alternates: { canonical: '/projects' },
}

export default function Projects() {
  return (
    <SimpleLayout
      title="What I spend my time on."
      intro="The companies are how the work ships. This site is me."
    >
      <ul
        role="list"
        className="grid grid-cols-1 gap-x-12 gap-y-16 sm:grid-cols-2"
      >
        {projects.map((project) => (
          <Card as="li" key={project.name}>
            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md ring-1 shadow-zinc-800/5 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0">
              <Image
                src={project.logo}
                alt=""
                className="h-8 w-8"
                unoptimized
              />
            </div>
            <h2 className="mt-6 text-base font-semibold text-zinc-800 dark:text-zinc-100">
              <Card.Link href={project.link.href}>{project.name}</Card.Link>
            </h2>
            <Card.Description>{project.description}</Card.Description>
            <p className="relative z-10 mt-6 flex text-sm font-medium text-zinc-400 transition group-hover:text-teal-500 dark:text-zinc-200">
              <LinkIcon className="h-6 w-6 flex-none" />
              <span className="ml-2">{project.link.label}</span>
            </p>
          </Card>
        ))}
      </ul>
    </SimpleLayout>
  )
}
