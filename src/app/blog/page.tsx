'use client';

/**
 * QRTagsPro — Page Blog (liste publique)
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import QRTagsLogo from '@/components/qrtags/QRTagsLogo';

const BLOG_CATEGORY_LABELS: Record<string, string> = {
  actualites: '📰 Actualités',
  conseils: '💡 Conseils',
  hajj: '🧳 Voyage',
  mises_a_jour: '🔄 Mises à jour',
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  publishedAt: string;
}

export default function BlogIndexPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog/public?limit=20')
      .then(res => res.json())
      .then(data => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <QRTagsLogo size="sm" href="/" withHover />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link href="/" className="hover:text-[#134288] transition">Accueil</Link>
            <Link href="/metiers" className="hover:text-[#134288] transition">Métiers</Link>
            <Link href="/tarifs" className="hover:text-[#134288] transition">Tarifs</Link>
            <Link href="/blog" className="text-[#134288]">Blog</Link>
            <Link href="/demo" className="hover:text-[#134288] transition">Démo</Link>
            <Link href="/contact" className="hover:text-[#134288] transition">Contact</Link>
          </nav>
          <Link href="/login" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#32ba5d] text-white rounded-lg hover:bg-[#28a54f] transition">
            Connexion
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-br from-[#134288] to-[#0d3266] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Blog & Actualités</h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Conseils, actualités et bonnes pratiques pour gérer les objets perdus
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-4 md:px-6">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-[#134288]/30 border-t-[#134288] rounded-full animate-spin mx-auto" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Aucun article pour le moment</h2>
              <p className="text-slate-500">Revenez bientôt pour des conseils et actualités !</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-[#32ba5d] hover:shadow-xl transition-all"
                >
                  <div className="relative aspect-square overflow-hidden bg-slate-100">
                    {post.coverImage ? (
                      <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#134288] to-[#0d3266]">
                        <Sparkles className="w-16 h-16 text-[#32ba5d]/40" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-[#134288] text-white text-xs font-bold rounded-full shadow-lg">
                        {BLOG_CATEGORY_LABELS[post.category] || post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs text-slate-400 mb-2">
                      {new Date(post.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#134288] transition-colors line-clamp-2">{post.title}</h3>
                    {post.excerpt && <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{post.excerpt}</p>}
                    <p className="text-sm font-bold text-[#32ba5d] mt-3 inline-flex items-center gap-1">
                      Lire l'article <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="bg-[#0d3266] text-white py-8">
        <div className="max-w-[1600px] mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-[#32ba5d]">
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </Link>
          <p className="mt-4 text-xs text-blue-300">© {new Date().getFullYear()} QRTagsPro</p>
        </div>
      </footer>
    </div>
  );
}
