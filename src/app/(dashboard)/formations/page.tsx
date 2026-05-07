import { createClient } from '@/lib/supabase/server'

export default async function FormationsPage() {
  const sb = await createClient()
  const { data: formations } = await sb
    .from('formations')
    .select('*')
    .order('reference')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">📚 Formations</h1>
        <p className="text-sm text-gray-500 mt-1">{formations?.length ?? 0} formations Color Aim</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(formations ?? []).map((f: any) => (
          <div key={f.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-pink-300 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-mono text-pink-400 font-medium">{f.reference}</span>
                <h2 className="font-semibold text-gray-900 mt-0.5">{f.titre}</h2>
              </div>
              {f.prix && (
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-semibold text-pink-700">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(f.prix)}
                  </div>
                  <div className="text-xs text-gray-400">HT / pers.</div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{f.description}</p>
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {f.duree && <span className="bg-gray-50 px-2 py-1 rounded-lg">⏱ {f.duree}</span>}
              {f.modalites && <span className="bg-gray-50 px-2 py-1 rounded-lg">📍 {f.modalites}</span>}
              {f.effectif && <span className="bg-gray-50 px-2 py-1 rounded-lg">👥 {f.effectif}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}