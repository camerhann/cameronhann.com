import Link from 'next/link'

import { Card } from '@/components/Card'
import { Container } from '@/components/Container'
import { Resume } from '@/components/Resume'
import { GitHubIcon, LinkedInIcon, XIcon } from '@/components/SocialIcons'
import { XFeed } from '@/components/XFeed'
import { type ArticleWithSlug, getAllArticles } from '@/lib/articles'
import { formatDate } from '@/lib/formatDate'
import { person, social, works } from '@/lib/site'

function Article({ article }: { article: ArticleWithSlug }) {
  return (
    <Card as="article">
      <Card.Title href={`/articles/${article.slug}`}>
        {article.title}
      </Card.Title>
      <Card.Eyebrow as="time" dateTime={article.date} decorate>
        {formatDate(article.date)}
      </Card.Eyebrow>
      <Card.Description>{article.description}</Card.Description>
      <Card.Cta>Read article</Card.Cta>
    </Card>
  )
}

function SocialLink({
  icon: Icon,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link> & {
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link className="group -m-1 p-1" rel="me" {...props}>
      <Icon className="h-6 w-6 fill-zinc-500 transition group-hover:fill-zinc-600 dark:fill-zinc-400 dark:group-hover:fill-zinc-300" />
    </Link>
  )
}

export default async function Home() {
  let articles = (await getAllArticles()).slice(0, 4)

  return (
    <>
      <Container className="mt-9">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
            I’m Chris Cameron-Hann.
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            {person.tagline}
          </p>
          <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
            Founder and CTO of Aegaea, CTO at 7Analytics, hydrometeorology
            adviser to the World Bank. Live flood flow predictions from forecast
            rainfall:{' '}
            <Link
              href={works.forecast.href}
              className="font-medium text-teal-500 transition hover:text-teal-600"
            >
              {works.forecast.label}
            </Link>
            . This site is the long form. The short version goes on X.
          </p>
          <div className="mt-6 flex gap-6">
            <SocialLink
              href={social.x.href}
              aria-label={social.x.label}
              icon={XIcon}
            />
            <SocialLink
              href={social.github.href}
              aria-label={social.github.label}
              icon={GitHubIcon}
            />
            <SocialLink
              href={social.linkedin.href}
              aria-label={social.linkedin.label}
              icon={LinkedInIcon}
            />
          </div>
        </div>
      </Container>
      <Container className="mt-24 md:mt-28">
        <div className="mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2">
          <div className="flex flex-col gap-16">
            {articles.map((article) => (
              <Article key={article.slug} article={article} />
            ))}
          </div>
          <div className="space-y-10 lg:pl-16 xl:pl-24">
            <Resume />
            <XFeed />
          </div>
        </div>
      </Container>
    </>
  )
}
