import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { IndicateurQualiopi, ActionCorrective } from '@/types'
import { RecommandationsIA } from '@/components/qualite/RecommandationsIA'

function scoreCouleur(score: number) {
  if (score >= 95) return 'text-green-700'
  if (score >= 85) return 'text-amber-600'
  return 'text-red-600'
}

function scoreBarCouleur(score: number) {
  if (score >= 95) return 'bg-green-500'
  if (score >= 85) return 'bg-amber-500'
  return 'bg-red-500'
}

const STATUT_STYLES: Record<string, string> = {
  'planifiée': 'bg-blue-50 text-blue-700',
  'en cours':  'bg-amber-50 text-amber-700',
  'en retard': 'bg-red-50 text-red-700',
  'clôturée':  'bg-green-50 text-green-700',
}

export default async function QualitePage() {
  const sb = await createClient()
  const [{ data: indicateurs }, { data: actions }, { data: actualites }] = await Promise.all([
    sb.from('indicateurs_qualiopi').select('*').order('numero_critere'),
    sb.from('actions_correctives').select('*').order('date_limite'),
    sb.from('veille_actualites').select('*').eq('statut', 'active')
      .order('epinglee', { ascending: false }).limit(3),
  ])

  const ind = (indicateurs ?? []) as IndicateurQualiopi[]
  const act = (actions ?? []) as ActionCorrective[]
  const scoreGlobal = ind.length > 0
    ? Math.round(ind.reduce((s, i) => s + i.score, 0) / ind.length) : 0

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">✅ Tableau de bord Qualité</h1>
          <p className="text-sm text-gray-500 mt-1">
            Prochain audit : <span className="font-medium text-pink-700">15/11/2026</span>
          </p>
        </div>
        <div className={`text-center px-5 py-2 rounded-xl border ${
          scoreGlobal >= 95 ? 'bg-green-50 border-green-200' :
          scoreGlobal >= 85 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className={`text-2xl font-semibold ${scoreCouleur(scoreGlobal)}`}>{scoreGlobal}%</div>
          <div className="text-xs text-gray-500">Score global</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-semibold text-green-700">{ind.filter(i => i.score >= 95).length}</div>
          <div className="text-xs text-green-600 mt-0.5">Critères conformes</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-semibold text-amber-700">{ind.filter(i => i.score < 95).length}</div>
          <div className="text-xs text-amber-600 mt-0.5">Critères à améliorer</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <div className="text-2xl font-semibold text-red-700">{act.filter(a => a.statut === 'en retard').length}</div>
          <div className="text-xs text-red-600 mt-0.5">Actions en retard</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">Les 7 critères Qualiopi</h2>
        </div>
        <div className="px-6 py-2 divide-y divide-gray-50">
          {ind.map((i) => (
            <div key={i.id} className="flex items-center gap-4 py-3.5">
              <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-pink-700">C{i.numero_critere}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">{i.libelle}</div>
                {i.detail && <div className="text-xs text-gray-400 mt-0.5 truncate">{i.detail}</div>}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 w-48">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${scoreBarCouleur(i.score)}`} style={{ width: `${i.score}%` }} />
                </div>
                <span className={`text-sm font-semibold w-10 text-right ${scoreCouleur(i.score)}`}>{i.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">⚠️ Actions correctives</h2>
        </div>
        {act.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">Aucune action corrective</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-400 px-6 py-2.5">Critère</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-2.5">Description</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-2.5">Responsable</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-2.5">Échéance</th>
                  <th className="text-left text-xs font-medium text-gray-400 px-4 py-2.5">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {act.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center justify-center w-7 h-7 bg-pink-50 text-pink-700 text-xs font-semibold rounded-lg">
                        C{a.numero_critere}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="text-sm text-gray-800">{a.description}</div>
                      {a.commentaire && <div className="text-xs text-gray-400 mt-0.5 italic">{a.commentaire}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{a.responsable}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{formatDate(a.date_limite)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUT_STYLES[a.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                        {a.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-gray-100">
          <RecommandationsIA indicateurs={ind} actions_en_cours={act} />
        </div>
      </div>
    </div>
  )
}
