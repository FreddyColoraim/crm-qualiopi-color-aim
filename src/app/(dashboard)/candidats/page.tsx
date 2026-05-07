import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const FINANCEUR_COLORS: Record<string, string> = {
  'AFDAS':        'bg-blue-50 text-blue-700',
  'FAFCEA':       'bg-purple-50 text-purple-700',
  "L'Opcommerce": 'bg-teal-50 text-teal-700',
  'OPCO 2i':      'bg-orange-50 text-orange-700',
  'CPF':          'bg-green-50 text-green-700',
}

export default async function CandidatsPage() {
  const sb = await createClient()
  const { data: candidats } = await sb
    .from('candidats')
    .select('*, inscriptions(id, statut, formation:formations(titre))')
    .order('nom')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">👤 Candidats</h1>
        <p className="text-sm text-gray-500 mt-1">{candidats?.length ?? 0} candidats</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-400 px-6 py-3">Candidat</th>
              <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Entreprise</th>
              <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Formation</th>
              <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Financeur</th>
              <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Dossier</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(candidats ?? []).map((c: any) => {
              const inscription = c.inscriptions?.[0]
              return (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-pink-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-pink-700">
                          {c.prenom[0]}{c.nom[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{c.prenom} {c.nom}</div>
                        <div className="text-xs text-gray-400">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{c.entreprise ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    {inscription ? (
                      <div>
                        <div className="text-xs text-gray-700 line-clamp-1">{inscription.formation?.titre}</div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          inscription.statut === 'validée' ? 'bg-green-50 text-green-700' :
                          inscription.statut === 'annulée' ? 'bg-red-50 text-red-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>{inscription.statut}</span>
                      </div>
                    ) : <span className="text-gray-400 text-xs">Aucune inscription</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    {c.financeur ? (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${FINANCEUR_COLORS[c.financeur] ?? 'bg-gray-100 text-gray-600'}`}>
                        {c.financeur}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-400 font-mono">{c.numero_dossier ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    <Link href={`/candidats/${c.id}`} className="text-xs text-pink-600 hover:text-pink-800 font-medium">
                      Voir →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {(candidats ?? []).length === 0 && (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            Aucun candidat pour l'instant
          </div>
        )}
      </div>
    </div>
  )
}