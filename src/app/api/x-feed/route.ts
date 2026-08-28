import { getXPosts } from '@/lib/x'

export const dynamic = 'force-dynamic'

export async function GET() {
  let posts = await getXPosts()
  return Response.json(
    { posts },
    {
      headers: {
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    },
  )
}
