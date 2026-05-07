'use client'
import { useState } from 'react'

export function RecommandationsIA({ indicateurs, actions_en_cours }: { indicateurs: any[], actions_en_cours?: any[] }) {
  const [analyse, setAnalyse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function analyser() {
    setLoading(true)
    setError('')
    setAnalyse(null)
    try {
      const res = await fetch('/api/qualiopi/recommandations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indicateurs: indicateurs.map((i: any) => ({
            numero_critere: i.numero_critere,
            libelle: i.libelle,
            score: i.score,
            detail: i.detail,
          })),
          actions_en_cours: (actions_en_cours ?? []).map((a: any) => ({
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
      const data = JSON.parse(buffer)
      setAnalyse(data)
    } catch (e: any) {
      setError("Erreur : " + e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4 bg-violet-50">
        <div>
          <div className="text-sm font-medium text-violet-900">✨ Axes d'amélioration continue</div>
          <div className="text-xs text-violet-500">Analyse Claude · recommandations personnalisées</div>
        </div>
        <button
          onClick={analyser}
          disabled={loading}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-pink-700 hover:bg-pink-800 text-white disabled:opacity-50 transition-colors"
        >
          {loading ? '⏳ Analyse...' : '✨ Analyser avec Claude'}
        </button>
      </div>
      <div className="px-6 py-5">
        {!analyse && !loading && !error && (
          <p className="text-center text-gray-400 text-sm py-4">
            Cliquez sur "Analyser avec Claude" pour obtenir des recommandations avant l'audit du 15/11/2026.
          </p>
        )}
        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">⚠️ {error}</div>}
        {analyse && (
          <div className="space-y-4">
            {analyse.alerte_audit && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">⚠️ {analyse.alerte_audit}</div>
            )}
            <div className="bg-violet-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">{analyse.niveau}</span>
                <span className="text-xl font-semibold text-violet-700">{analyse.score_global}%</span>
              </div>
              <p className="text-sm text-gray-700">{analyse.synthese}</p>
            </div>
            {analyse.points_forts?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">✅ Points forts</div>
                {analyse.points_forts.map((p: string, i: number) => (
                  <div key={i} className="flex gap-2 text-sm text-gray-700 mb-1">
                    <span className="text-green-500">✓</span> {p}
                  </div>
                ))}
              </div>
            )}
            {analyse.recommandations?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Actions recommandées</div>
                {analyse.recommandations.map((r: any, i: number) => (
                  <div key={i} className={`border rounded-xl p-4 mb-2 ${r.priorite === 'haute' ? 'bg-red-50 border-red-200' : r.priorite === 'moyenne' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">C{r.critere}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.priorite === 'haute' ? 'bg-red-100 text-red-700' : r.priorite === 'moyenne' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {r.priorite}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-800 mb-1">{r.action}</div>
                    <div className="text-xs text-gray-500">⏱ {r.delai_suggere}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Impact : {r.impact}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="text-right">
              <button onClick={analyser} className="text-xs text-violet-600 hover:text-violet-800">🔄 Régénérer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}