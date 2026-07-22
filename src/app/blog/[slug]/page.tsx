'use client';

/**
 * QRTagsPro — Page article de blog (publique)
 *
 * Affiche un article de blog publié.
 * URL: /blog/[slug]
 */

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, ArrowRight } from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

const BLOG_CATEGORY_LABELS: Record<string, string> = {
  actualites: '📰 Actualités',
  conseils: '💡 Conseils',
  hajj: '🧳 Voyage',
  mises_a_jour: '🔄 Mises à jour',
};

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  publishedAt: string | null;
  author: { name: string | null } | null;
}

export default function BlogArticlePage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/blog/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.post) setPost(data.post);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#134288]/30 border-t-[#134288] rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Article introuvable</h1>
          <Link href="/" className="text-[#134288] font-semibold hover:underline">← Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <QRTagsLogo size="sm" href="/" withHover />
          <Link href="/" className="text-sm text-slate-500 hover:text-[#134288]">
            <ArrowLeft className="w-4 h-4 inline mr-1" /> Accueil
          </Link>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        {/* Catégorie + date */}
        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-[#134288] text-white text-xs font-bold rounded-full">
            {BLOG_CATEGORY_LABELS[post.category] || post.category}
          </span>
          {post.publishedAt && (
            <span className="text-sm text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(post.publishedAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          )}
        </div>

        {/* Titre */}
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg text-slate-600 leading-relaxed mb-8">{post.excerpt}</p>
        )}

        {/* Cover image */}
        {post.coverImage && (
          <div className="rounded-2xl overflow-hidden mb-8 shadow-lg">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>
        )}

        {/* Author */}
        {post.author?.name && (
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-200">
            <div className="w-10 h-10 rounded-full bg-[#134288] flex items-center justify-center text-white font-bold">
              {post.author.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{post.author.name}</p>
              <p className="text-xs text-slate-400">Auteur</p>
            </div>
          </div>
        )}

        {/* Contenu HTML */}
        <div
          className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-[#134288] prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* CTA */}
        <div className="mt-12 p-6 bg-[#134288] rounded-2xl text-center">
          <h3 className="text-xl font-bold text-white mb-2">Découvrez QRTagsPro</h3>
          <p className="text-blue-100 mb-4 text-sm">
            La solution de gestion d'objets perdus pour votre établissement
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#32ba5d] text-white font-bold rounded-lg hover:bg-[#28a54f] transition shadow-lg"
          >
            Tester la démo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Retour */}
        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#134288]">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </Link>
        </div>
      </article>
    </div>
  );
}
