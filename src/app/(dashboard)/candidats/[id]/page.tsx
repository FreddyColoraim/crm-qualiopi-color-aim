import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function CandidatPage({ params }: { params: { id: string } }) {
  const sb = await createClient()
  const { data: candidat } = await sb
    .from('candidats')
    .select('*, inscriptions(*, formation:formations(*), documents(*), demandes_opco(*))')
    .eq('id', params.id)
    .single()

  if (!candidat) return <div className="p-8">Candidat non trouvé</div>

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/candidats" className="text-sm text-gray-400 hover:text-gray-700 mb-6 inline-block">
        ← Retour aux candidats
      </Link>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center">
          <span className="text-xl font-semibold text-pink-700">{candidat.prenom[0]}{candidat.nom[0]}</span>
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{candidat.prenom} {candidat.nom}</h1>
          <p className="text-sm text-gray-500">{candidat.poste} · {candidat.entreprise}</p>
        </div>
        <span className="ml-auto text-xs font-mono bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg">{candidat.numero_dossier}</span>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Informations</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-xs text-gray-400 mb-0.5">Email</div><div className="text-gray-800">{candidat.email}</div></div>
          <div><div className="text-xs text-gray-400 mb-0.5">Téléphone</div><div className="text-gray-800">{candidat.telephone}</div></div>
          <div><div className="text-xs text-gray-400 mb-0.5">Entreprise</div><div className="text-gray-800">{candidat.entreprise}</div></div>
          <div><div className="text-xs text-gray-400 mb-0.5">Financeur</div><div className="text-gray-800">{candidat.financeur}</div></div>
        </div>
      </div>
      {(candidat.inscriptions ?? []).length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-center text-sm text-gray-400">
          Aucune inscription pour ce candidat
        </div>
      )}
      {(candidat.inscriptions ?? []).map((ins: any) => (
        <div key={ins.id} className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">📚 {ins.formation?.titre}</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-500">{ins.formation?.reference}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ins.statut === 'validée' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{ins.statut}</span>
          </div>
        </div>
      ))}
    </div>
  )
}