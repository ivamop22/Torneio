'use client';

import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const STATUS_LABEL: Record<string, string> = {
  live: '🔴 Ao Vivo',
  finished: '✅ Finalizado',
  open: '📋 Inscrições Abertas',
  ongoing: '🎾 Em Andamento',
  draft: '📝 Rascunho',
  published: '📢 Publicado',
};

const STATUS_COLORS: Record<string, string> = {
  live: 'bg-red-500/20 text-red-400 border-red-500/30',
  finished: 'bg-emerald-500/15 text-emerald-400 border-emerald-600/30',
  open: 'bg-blue-500/15 text-blue-400 border-blue-600/30',
  ongoing: 'bg-amber-500/15 text-amber-400 border-amber-600/30',
  draft: 'bg-slate-600/20 text-slate-500 border-slate-600/30',
  published: 'bg-purple-500/15 text-purple-400 border-purple-600/30',
};

export default function TournamentsListPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/tournaments`)
      .then((r) => r.json())
      .then((data) => { setTournaments(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 text-white font-bold">
            <span className="text-xl">🎾</span>
            <span>Beach Tennis</span>
          </a>
          <div className="ml-auto flex items-center gap-4">
            <a href="/torneios" className="text-sm text-slate-300 hover:text-white font-medium">Torneios</a>
            <a href="/" className="text-sm bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg transition-colors">
              Admin →
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Torneios de Beach Tennis</h1>
          <p className="text-slate-400 mt-1">Acompanhe ao vivo, resultados e rankings</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-slate-400">Carregando...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎾</div>
            <p className="text-slate-400 text-lg">Nenhum torneio cadastrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournaments.map((t) => (
              <a
                key={t.id}
                href={`/torneios/${t.slug}`}
                className="group block bg-slate-900 rounded-xl border border-slate-700/60 hover:border-green-600/50 p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2 className="font-bold text-white text-lg leading-tight group-hover:text-green-400 transition-colors">
                    {t.name}
                  </h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${STATUS_COLORS[t.status] ?? STATUS_COLORS.draft}`}>
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-slate-400">
                  <p>📍 {[t.city, t.state].filter(Boolean).join(', ') || 'Local não definido'}</p>
                  <p>📅 {t.startDate?.slice(0, 10)} → {t.endDate?.slice(0, 10)}</p>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-xs text-slate-600 uppercase">{t.level}</span>
                  <span className="text-xs text-green-500 group-hover:text-green-400">Ver chaveamento →</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
