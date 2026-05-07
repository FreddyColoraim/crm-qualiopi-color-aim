'use client'

import { useState } from 'react'
import type { IndicateurQualiopi, ActionCorrective, AnalyseIA, RecommandationIA } from '@/types'

interface Props {
  indicateurs: IndicateurQualiopi[]
  actions_en_cours?: ActionCorrective[]
}

const PRIORITE: Record<string, { container: string; badge: string; label: string }> = {
  haute:   { container: 'bg-red-50 border-red-200',    badge: 'bg-red-100 text-red-700',    label: 'Priorité haute'   },
  moyenne: { container: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'Priorité moyenne' },
  faible:  { container: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700', label: 'Priorité faible'  },
}

function RecCard({ rec }: { rec: RecommandationIA }) {
  const [open, setOpen] = useState(false)
  const s = PRIORITE[rec.priorite] ?? PRIORITE.faible
  return (
    <div className={`border rounded-xl overflow-hidden ${s.container}`}>
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left" onClick={() => setOpen(!open)}>
        <span className="text-xs font-bold text-gray-400 w-6">C{rec.critere}</span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${s.badge}`}>{s.label}</span>
        <span className="flex-1 text-sm font-medium text-gray-800">{rec.action}</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-white/60 space-y-1.5">
          <p className="text-xs text-gray-600"><span className="font-medium text-gray-700">Critère :</span> {rec.libelle}</p>
          <p className="text-xs text-gray-600"><span className="font-medium text-gray-700">Impact audit :</span> {rec.impact}</p>
          <p className="text-xs text-gray-600"><span className="font-medium text-gray-700">Délai :</span> {rec.delai_suggere}</p>
          <p className="text-xs text-gray-600"><span className="font-medium text-gray-700">Ressources :</span> {rec.ressources}</p>
        </div>
      )}
    </div>
  )
}

export function RecommandationsIA({ indicateurs, actions_en_cours }: Props) {
  const [analyse, setAnalyse] = useState<AnalyseIA | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyser() {
    setLoading(true)
    setError(null)
    setAnalyse(null)
    try {
      const res = await fetch('/api/qualiopi/recommandations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indicateurs: indicateurs.map(i => ({
            numero_critere: i.numero_critere,
            libelle: i.libelle,
            score: i.score,
            detail: i.detail,
          })),
          actions_en_cours: (actions_en_cours ?? []).map(a => ({
            numero_critere: a.numero_critere,
            description: a.description,
            statut: a.statut,
            date_limite: a.date_limite,
          })),
        }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
      }
      setAnalyse(JSON.parse(buffer))
    } catch {
      setError("Impossible de générer l'analyse. Vérifiez la clé ANTHROPIC_API_KEY.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4 bg-violet-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
            <span>✨</span>
          </div>
          <div>
            <div className="text-sm font-medium text-violet-900">Axes d'amélioration continue</div>
            <div className="text-xs text-violet-500">Analyse Claude · recommandations personnalisées</div>
          </div>
        </div>
        <button
          onClick={analyser}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-pink-700 hover:bg-pink-800 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '⏳ Analyse en cours...' : '✨ Analyser avec Claude'}
        </button>
      </div>

      <div className="px-6 py-5">
        {!analyse && !loading && !error && (
          <p className="text-center text-gray-400 text-sm py-6">
            Cliquez sur "Analyser avec Claude" pour obtenir des recommandations personnalisées avant l'audit du 15/11/2026.
          </p>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}
        {analyse && (
          <div className="space-y-5">
            {analyse.alerte_audit && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                ⚠️ {analyse.alerte_audit}
              </div>
            )}
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">{analyse.niveau}</span>
                <span className="text-xl font-semibold text-violet-700">{analyse.score_global}%</span>
                <span className="text-xs text-gray-400">score global</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{analyse.synthese}</p>
            </div>
            {analyse.points_forts.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">✅ Points forts</h3>
                <ul className="space-y-1.5">
                  {analyse.points_forts.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 mt-0.5">✓</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Actions recommandées ({analyse.recommandations.length})
              </h3>
              <div className="space-y-2">
                {analyse.recommandations.map((r, i) => <RecCard key={i} rec={r} />)}
              </div>
            </div>
            <div className="text-right pt-2 border-t border-gray-100">
              <button onClick={analyser} className="text-xs text-violet-600 hover:text-violet-800">
                🔄 Régénérer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
