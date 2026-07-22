import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/blog/public
 *
 * Liste les derniers articles publiés (PUBLIC, sans authentification).
 * Utilisé par la page d'accueil pour afficher le blog.
 *
 * Query params:
 *   limit: number (défaut 3)
 *   category: string (optionnel)
 *
 * Retourne les articles avec: title, slug, excerpt, coverImage, category, publishedAt
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '3');
    const category = searchParams.get('category');

    const where: Record<string, unknown> = {
      status: 'published',
      publishedAt: { lte: new Date() },
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    const posts = await db.blogPost.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        category: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('[blog/public] Error:', error);
    return NextResponse.json({ posts: [] }, { status: 500 });
  }
}
