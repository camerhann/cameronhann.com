import { type Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'

import { Container } from '@/components/Container'
import { JsonLd } from '@/components/JsonLd'
import { GitHubIcon, LinkedInIcon, XIcon } from '@/components/SocialIcons'
import portraitImage from '@/images/portrait.jpg'
import { profilePageGraph } from '@/lib/json-ld'
import { person, social } from '@/lib/site'

function SocialLink({
  className,
  href,
  children,
  icon: Icon,
}: {
  className?: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <li className={clsx(className, 'flex')}>
      <Link
        href={href}
        rel="me"
        className="group flex text-sm font-medium text-zinc-800 transition hover:text-teal-500 dark:text-zinc-200 dark:hover:text-teal-500"
      >
        <Icon className="h-6 w-6 flex-none fill-zinc-500 transition group-hover:fill-teal-500" />
        <span className="ml-4">{children}</span>
      </Link>
    </li>
  )
}

export const metadata: Metadata = {
  title: 'About',
  description:
    'Chris Cameron-Hann is a flood hydrologist. Founder and CTO of Aegaea, CTO at 7Analytics, World Bank hydrometeorology adviser. MSci Geographical Science, University of Bristol.',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'profile',
    title: 'About Chris Cameron-Hann',
    description:
      'Flood hydrologist. Founder and CTO of Aegaea, CTO at 7Analytics, World Bank hydrometeorology adviser.',
  },
}

function AboutSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-base text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </section>
  )
}

export default function About() {
  return (
    <>
      <JsonLd data={profilePageGraph()} />
      <Container className="mt-16 sm:mt-32">
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-y-12">
          <div className="lg:pl-20">
            <div className="max-w-xs px-2.5 lg:max-w-none">
              <Image
                src={portraitImage}
                alt={person.name}
                sizes="(min-width: 1024px) 32rem, 20rem"
                className="aspect-square rotate-3 rounded-2xl bg-zinc-100 object-cover dark:bg-zinc-800"
              />
            </div>
          </div>
          <div className="lg:order-first lg:row-span-2">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
              I’m Chris Cameron-Hann. Flood hydrologist.
            </h1>
            <div className="mt-6 space-y-7 text-base text-zinc-600 dark:text-zinc-400">
              <p>
                Flood risk is sold as a map. It isn’t. It is a claim about how
                water moves, a system that has to run, and a team that will
                still be there when someone asks: are you sure?
              </p>
              <p>
                I founded Aegaea in 2012 and I am CTO there. I am also CTO at
                7Analytics, building flood data for insurers at building scale.
                I advise the World Bank on hydrometeorology and flood
                forecasting. On the side I am building Hydrometric — the FEH
                statistical pathway without the 2003 desktop and the Excel
                round-trip.
              </p>
              <p>
                This site is me, not a company. Long essays live here. Short
                versions go on X at {social.x.handle}.
              </p>
            </div>
            <div className="mt-16 space-y-16">
              <AboutSection title="Now">
                <p>
                  Aegaea is a UK flood risk consultancy I founded so the work
                  could ship without me in the loop. Modelling, drainage,
                  planning — a team that can issue.
                </p>
                <p>
                  I joined 7Analytics in 2024 and I am CTO. The job is flood
                  data trained on claims, at the building, for insurers and
                  asset owners.
                </p>
                <p>
                  Hydrometric is the UK statistical pathway in the browser:
                  catchment, pooling, forks, Method Space, and a report that
                  keeps its working.
                </p>
              </AboutSection>
              <AboutSection title="World Bank">
                <p>
                  Since 2020 I have advised the World Bank on hydrometeorology:
                  observation networks, flood forecasting, and how a
                  hydrological service actually runs after the consultants
                  leave. Capacity, gap analysis, investment, technical advice.
                </p>
                <p>
                  On paper that shows up as hydrological consultant. I am named
                  on the{' '}
                  <a
                    href="https://documents1.worldbank.org/curated/en/099061824111533516/pdf/P16000510472f109181ba107347fe33e88.pdf"
                    className="text-teal-500 transition hover:text-teal-600"
                  >
                    Sri Lanka Climate Resilience programme
                  </a>
                  . In 2021 I was appointed to a{' '}
                  <a
                    href="https://aegaea.com/about-us/news/aegaea-director-appointed-to-world-bank-group/"
                    className="text-teal-500 transition hover:text-teal-600"
                  >
                    World Bank working group
                  </a>{' '}
                  on the future of hydrological observation networks.
                </p>
                <p>
                  I spent two years in Sri Lanka on World Bank-funded flood risk
                  and climate-resilience work with the Irrigation Department:
                  basin investment plans first, then hydrology, forecasting, and
                  the modernisation roadmap.
                </p>
              </AboutSection>
              <AboutSection title="Training">
                <p>
                  MSci in Geographical Science from the University of Bristol,
                  2007, hydraulic and environmental modelling. I have worked in
                  flood risk since then, apart from a short spell teaching.
                </p>
                <p>
                  Before Aegaea took the time, I modelled at Atkins, Waterman,
                  Edenvale Young, and for the Environment Agency.
                </p>
              </AboutSection>
            </div>
          </div>
          <div className="lg:pl-20">
            <ul role="list">
              <SocialLink href={social.x.href} icon={XIcon}>
                Follow {social.x.handle} on X
              </SocialLink>
              <SocialLink
                href={social.github.href}
                icon={GitHubIcon}
                className="mt-4"
              >
                Follow on GitHub
              </SocialLink>
              <SocialLink
                href={social.linkedin.href}
                icon={LinkedInIcon}
                className="mt-4"
              >
                Follow on LinkedIn
              </SocialLink>
            </ul>
          </div>
        </div>
      </Container>
    </>
  )
}
