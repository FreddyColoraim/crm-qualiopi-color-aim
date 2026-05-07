import { createClient } from '@/lib/supabase/server'

export default async function VeillePage() {
  const sb = await createClient()
  const { data: actualites } = await sb
    .from('veille_actualites')
    .select('*')
    .eq('statut', 'active')
    .order('epinglee', { ascending: false })
    .order('date_publication', { ascending: false })

  const IMPACT: Record<string, string> = {
    'élevé': 'bg-red-50 text-red-700 border border-red-200',
    'moyen': 'bg-amber-50 text-amber-700 border border-amber-200',
    'faible': 'bg-green-50 text-green-700 border border-green-200',
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">📰 Veille réglementaire</h1>
        <p className="text-sm text-gray-500 mt-1">{actualites?.length ?? 0} actualités actives</p>
      </div>
      <div className="space-y-4">
        {(actualites ?? []).map((a: any) => (
          <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-pink-200 transition-colors">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  {a.epinglee && <span className="text-amber-500 text-xs">📌 Épinglée</span>}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${IMPACT[a.niveau_impact]}`}>
                    Impact {a.niveau_impact}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                    {a.categorie}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 mb-1">{a.titre}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  {a.source && <span>{a.source}</span>}
                  {a.url_source && (
                    <a href={a.url_source} target="_blank" rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-700 transition-colors">
                      Lire la source →
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}