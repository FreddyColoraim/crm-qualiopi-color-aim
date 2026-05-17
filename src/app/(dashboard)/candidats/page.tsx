'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Users, Search, UserCircle, UserPlus, ChevronRight } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Candidat {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string | null
  entreprise: string | null
  poste: string | null
  financeur: string | null
  numero_dossier: string | null
}

// ─── Badge financeur ─────────────────────────────────────────────────────────
const financeurColors: Record<string, string> = {
  'AFDAS':        'bg-purple-50 text-purple-700 border-purple-200',
  'FAFCEA':       'bg-blue-50 text-blue-700 border-blue-200',
  "L'Opcommerce": 'bg-green-50 text-green-700 border-green-200',
  'OPCO 2i':      'bg-orange-50 text-orange-700 border-orange-200',
  'CPF':          'bg-pink-50 text-pink-700 border-pink-200',
}

function FinanceurBadge({ financeur }: { financeur: string | null }) {
  if (!financeur) return null
  const cls = financeurColors[financeur] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cls}`}>
      {financeur}
    </span>
  )
}

// ─── Carte candidat ──────────────────────────────────────────────────────────
function CarteCandidат({ c }: { c: Candidat }) {
  const initiales = `${c.prenom[0]}${c.nom[0]}`.toUpperCase()
  return (
    <Link
      href={`/candidats/${c.id}`}
      className="group flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-[#A0195B] hover:shadow-md transition-all duration-150"
    >
      <div className="w-10 h-10 rounded-full bg-[#FEE7F0] text-[#A0195B] font-semibold text-sm flex items-center justify-center flex-shrink-0">
        {initiales}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-[#A0195B] transition-colors">
            {c.prenom} {c.nom}
          </p>
          <FinanceurBadge financeur={c.financeur} />
        </div>
        <p className="text-xs text-gray-500 truncate">{c.email}</p>
        {(c.entreprise || c.poste) && (
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {[c.poste, c.entreprise].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {c.numero_dossier && (
          <span className="text-xs font-mono text-gray-400 hidden sm:block">
            {c.numero_dossier}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#A0195B] transition-colors" />
      </div>
    </Link>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function CandidatsPage() {
  const [candidats, setCandidats] = useState<Candidat[]>([])
  const [recherche, setRecherche] = useState('')
  const [financeurFiltre, setFinanceurFiltre] = useState('Tous')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('candidats')
      .select('*')
      .order('nom')
      .then(({ data }) => {
        setCandidats(data ?? [])
        setLoading(false)
      })
  }, [])

  const financeurs = ['Tous', 'AFDAS', 'FAFCEA', "L'Opcommerce", 'OPCO 2i', 'CPF']

  const filtres = candidats.filter(c => {
    const q = recherche.toLowerCase()
    const matchRecherche =
      !q ||
      c.nom.toLowerCase().includes(q) ||
      c.prenom.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.entreprise ?? '').toLowerCase().includes(q) ||
      (c.numero_dossier ?? '').toLowerCase().includes(q)
    const matchFinanceur =
      financeurFiltre === 'Tous' || c.financeur === financeurFiltre
    return matchRecherche && matchFinanceur
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#A0195B]" />
            Candidats
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '…' : `${candidats.length} candidat${candidats.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Boutons actions */}
          <div className="flex gap-2">
            <a href="/candidats/import" className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              📊 Import CSV
            </a>
        <Link
          href="/candidats/nouveau"
          className="flex items-center gap-1.5 text-sm font-medium bg-[#A0195B] text-white px-4 py-2.5 rounded-xl hover:bg-[#8A1548] transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Nouveau candidat
        </Link>
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, email, entreprise, n° dossier…"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#A0195B] focus:ring-1 focus:ring-[#A0195B]"
        />
      </div>

      {/* Filtres financeur */}
      <div className="flex gap-2 flex-wrap mb-6">
        {financeurs.map(f => (
          <button
            key={f}
            onClick={() => setFinanceurFiltre(f)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              financeurFiltre === f
                ? 'bg-[#A0195B] text-white border-[#A0195B]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#A0195B] hover:text-[#A0195B]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtres.length === 0 ? (
        <div className="text-center py-20">
          <UserCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">Aucun candidat trouvé</p>
          <Link
            href="/candidats/nouveau"
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-[#A0195B] hover:underline"
          >
            <UserPlus className="w-4 h-4" />
            Ajouter un candidat
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtres.map(c => (
            <CarteCandidат key={c.id} c={c} />
          ))}
        </div>
      )}

      {/* Stats financeurs */}
      {!loading && candidats.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Répartition par financeur
          </p>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(
              candidats.reduce((acc, c) => {
                const f = c.financeur ?? 'Non renseigné'
                acc[f] = (acc[f] ?? 0) + 1
                return acc
              }, {} as Record<string, number>)
            ).map(([f, n]) => (
              <div key={f} className="flex items-center gap-1.5">
                <FinanceurBadge financeur={f === 'Non renseigné' ? null : f} />
                {f === 'Non renseigné' && <span className="text-xs text-gray-400">{f}</span>}
                <span className="text-xs font-semibold text-gray-600">{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
