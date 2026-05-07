import { createClient } from '@/lib/supabase/server'
import { RecommandationsIA } from '@/components/qualite/RecommandationsIA'

export default async function QualitePage() {
  const sb = await createClient()
  const { data: ind } = await sb.from('indicateurs_qualiopi').select('*').order('numero_critere')
  const { data: act } = await sb.from('actions_correctives').select('*').order('date_limite')

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">✅ Qualité Qualiopi</h1>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">Les 7 critères</h2>
        </div>
        <div className="px-6 divide-y divide-gray-50">
          {(ind ?? []).map((i: any) => (
            <div key={i.id} className="flex items-center gap-4 py-3">
              <span className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center text-xs font-semibold text-pink-700 flex-shrink-0">C{i.numero_critere}</span>
              <div className="flex-1 text-sm text-gray-800">{i.libelle}</div>
              <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${i.score >= 95 ? 'bg-green-500' : i.score >= 85 ? 'bg-amber-500' : 'bg-red-500'}`} style={{width:`${i.score}%`}}/>
              </div>
              <span className="text-sm font-semibold text-gray-700 w-10 text-right">{i.score}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">⚠️ Actions correctives</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {(act ?? []).map((a: any) => (
            <div key={a.id} className="flex items-center gap-4 px-6 py-3">
              <span className="w-7 h-7 bg-pink-50 text-pink-700 text-xs font-semibold rounded-lg flex items-center justify-center flex-shrink-0">C{a.numero_critere}</span>
              <div className="flex-1 text-sm text-gray-800">{a.description}</div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.statut === 'en retard' ? 'bg-red-50 text-red-700' : a.statut === 'en cours' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{a.statut}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100">
          <RecommandationsIA indicateurs={ind ?? []} actions_en_cours={act ?? []} />
        </div>
      </div>
    </div>
  )
}