import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: nbCandidats },
    { count: nbFormations },
    { data: sessions },
    { data: indicateurs },
    { data: actions },
    { data: prospects },
  ] = await Promise.all([
    supabase.from('candidats').select('*', { count: 'exact', head: true }),
    supabase.from('formations').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('*').gte('date_debut', new Date().toISOString().split('T')[0]).order('date_debut').limit(5),
    supabase.from('indicateurs_qualiopi').select('*').order('numero_critere'),
    supabase.from('actions_correctives').select('*').neq('statut', 'clôturée').order('date_limite').limit(3),
    supabase.from('prospects').select('*', { count: 'exact' }).limit(1),
  ])

  const scoreGlobal = indicateurs && indicateurs.length > 0
    ? Math.round(indicateurs.reduce((a, i) => a + i.score, 0) / indicateurs.length)
    : 0

  const prochaineSessions = sessions ?? []
  const actionsEnCours = actions ?? []

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function scoreColor(s: number) {
    if (s >= 90) return 'text-green-600'
    if (s >= 70) return 'text-amber-600'
    return 'text-red-500'
  }

  function statutColor(s: string) {
    const map: Record<string, string> = {
      'en cours':  'bg-amber-50 text-amber-700',
      'en retard': 'bg-red-50 text-red-600',
      'planifiée': 'bg-blue-50 text-blue-700',
      'clôturée':  'bg-green-50 text-green-700',
    }
    return map[s] ?? 'bg-gray-50 text-gray-600'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">
          Prochain audit Qualiopi : <span className="font-medium text-[#BE185D]">15/11/2026</span>
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Candidats', value: nbCandidats ?? 0, icon: '👤', href: '/candidats', color: 'text-blue-600' },
          { label: 'Formations', value: nbFormations ?? 0, icon: '📚', href: '/formations', color: 'text-[#BE185D]' },
          { label: 'Score Qualiopi', value: `${scoreGlobal}%`, icon: '✅', href: '/qualite', color: scoreColor(scoreGlobal) },
          { label: 'Actions en cours', value: actionsEnCours.length, icon: '⚠️', href: '/qualite', color: 'text-amber-600' },
        ].map(k => (
          <Link key={k.label} href={k.href} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-[#BE185D]/30 hover:shadow-sm transition-all">
            <div className="text-2xl mb-2">{k.icon}</div>
            <div className={`text-2xl font-semibold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{k.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Indicateurs Qualiopi */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Indicateurs Qualiopi</h2>
            <Link href="/qualite" className="text-xs text-[#BE185D] hover:underline">Voir tout →</Link>
          </div>
          <div className="space-y-3">
            {(indicateurs ?? []).map(ind => (
              <div key={ind.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 text-xs">C{ind.numero_critere} — {ind.libelle}</span>
                  <span className={`text-xs font-semibold ${scoreColor(ind.score)}`}>{ind.score}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${ind.score >= 90 ? 'bg-green-500' : ind.score >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${ind.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prochaines sessions */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Prochaines sessions</h2>
            <Link href="/formations" className="text-xs text-[#BE185D] hover:underline">Voir tout →</Link>
          </div>
          {prochaineSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-sm">Aucune session planifiée</p>
              <Link href="/formations" className="text-xs text-[#BE185D] hover:underline mt-1 block">Ajouter une session →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {prochaineSessions.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{formatDate(s.date_debut)}</div>
                    <div className="text-xs text-gray-400">{formatDate(s.date_fin)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[#BE185D]">{s.places_restantes}/{s.places_max}</div>
                    <div className="text-xs text-gray-400">places dispo</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions correctives */}
        {actionsEnCours.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Actions correctives</h2>
              <Link href="/qualite" className="text-xs text-[#BE185D] hover:underline">Voir tout →</Link>
            </div>
            <div className="space-y-3">
              {actionsEnCours.map(a => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1">
                    <div className="text-sm text-gray-800">{a.description}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Échéance : {formatDate(a.date_limite)}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${statutColor(a.statut)}`}>{a.statut}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accès rapides */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Accès rapides</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/candidats', icon: '👤', label: 'Candidats' },
              { href: '/formations', icon: '📚', label: 'Formations' },
              { href: '/formateurs', icon: '👩‍🏫', label: 'Formateurs' },
              { href: '/recrutement', icon: '📣', label: 'Recrutement' },
              { href: '/qualite', icon: '✅', label: 'Qualité' },
              { href: '/veille', icon: '📰', label: 'Veille' },
            ].map(a => (
              <Link key={a.href} href={a.href} className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-[#fdf2f8] hover:text-[#BE185D] transition-colors">
                <span>{a.icon}</span>{a.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
