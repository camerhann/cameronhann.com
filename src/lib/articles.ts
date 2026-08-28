interface Article {
  title: string
  description: string
  author: string
  date: string
  image?: string
}

export interface ArticleWithSlug extends Article {
  slug: string
}

const articleLoaders = [
  {
    slug: 'what-a-river-remembers',
    load: () => import('../app/articles/what-a-river-remembers/page.mdx'),
  },
  {
    slug: 'why-build-hydrometric',
    load: () => import('../app/articles/why-build-hydrometric/page.mdx'),
  },
  {
    slug: 'i-build-models-software-teams',
    load: () => import('../app/articles/i-build-models-software-teams/page.mdx'),
  },
] as const

async function importArticle({
  slug,
  load,
}: (typeof articleLoaders)[number]): Promise<ArticleWithSlug> {
  let { article } = (await load()) as {
    default: React.ComponentType
    article: Article
  }

  return {
    slug,
    ...article,
  }
}

export async function getAllArticles() {
  let articles = await Promise.all(articleLoaders.map(importArticle))

  return articles.sort((a, z) => +new Date(z.date) - +new Date(a.date))
}
