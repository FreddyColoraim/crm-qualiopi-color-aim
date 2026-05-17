import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { NouvelleFormationButton } from '@/components/NouvelleFormationButton'
import { BookOpen, Clock, Users, Euro, MapPin, ChevronRight } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Formation {
  id: string
  titre: string
  reference: string
  duree: string | null
  modalites: string | null
  effectif: string | null
  prix: number | null
  public_cible: string | null
  prerequis: string | null
  description: string | null
}

interface Session {
  id: string
  formation_id: string
  date_debut: string
  date_fin: string
  places_restantes: number
  places_max: number
  statut: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function statutBadge(statut: string) {
  const map: Record<string, string> = {
    confirmée:       'bg-green-50 text-green-700 border border-green-200',
    planifiée:       'bg-blue-50 text-blue-700 border border-blue-200',
    complet:         'bg-red-50 text-red-700 border border-red-200',
    'presque complet': 'bg-amber-50 text-amber-700 border border-amber-200',
    annulée:         'bg-gray-100 text-gray-500 border border-gray-200',
  }
  return map[statut] ?? 'bg-gray-100 text-gray-500 border border-gray-200'
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function placesColor(restantes: number, max: number) {
  const ratio = restantes / max
  if (ratio === 0) return 'text-red-600'
  if (ratio <= 0.33) return 'text-amber-600'
  return 'text-green-600'
}

// ─── Carte formation ─────────────────────────────────────────────────────────
function CarteFormation({
  formation,
  sessions,
}: {
  formation: Formation
  sessions: Session[]
}) {
  const prochaineSession = sessions
    .filter(s => s.statut !== 'annulée')
    .sort((a, b) => new Date(a.date_debut).getTime() - new Date(b.date_debut).getTime())[0]

  return (
    <Link
      href={`/formations/${formation.id}`}
      className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-[#A0195B] hover:shadow-lg transition-all duration-200"
    >
      {/* En-tête colorée */}
      <div className="h-2 bg-[#A0195B]" />

      <div className="p-6">
        {/* Référence + titre */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <span className="text-xs font-mono text-[#A0195B] bg-[#FEE7F0] px-2 py-0.5 rounded">
              {formation.reference}
            </span>
            <h3 className="mt-2 text-base font-semibold text-gray-900 group-hover:text-[#A0195B] leading-snug transition-colors">
              {formation.titre}
            </h3>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#A0195B] flex-shrink-0 mt-1 transition-colors" />
        </div>

        {/* Description courte */}
        {formation.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
            {formation.description}
          </p>
        )}

        {/* Métadonnées */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {formation.duree && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Clock className="w-3.5 h-3.5 text-[#A0195B]" />
              {formation.duree}
            </div>
          )}
          {formation.effectif && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Users className="w-3.5 h-3.5 text-[#A0195B]" />
              {formation.effectif}
            </div>
          )}
          {formation.modalites && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-[#A0195B]" />
              {formation.modalites}
            </div>
          )}
          {formation.prix !== null && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#A0195B]">
              <Euro className="w-3.5 h-3.5" />
              {formation.prix.toLocaleString('fr-FR')} € HT / pers.
            </div>
          )}
        </div>

        {/* Prochaine session */}
        {prochaineSession ? (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Prochaine session</p>
              <p className="text-xs font-medium text-gray-700">
                {formatDate(prochaineSession.date_debut)} → {formatDate(prochaineSession.date_fin)}
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${statutBadge(prochaineSession.statut)}`}>
                {prochaineSession.statut}
              </span>
              <p className={`text-xs font-semibold mt-1 ${placesColor(prochaineSession.places_restantes, prochaineSession.places_max)}`}>
                {prochaineSession.places_restantes}/{prochaineSession.places_max} places
              </p>
            </div>
          </div>
        ) : (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 italic">Aucune session planifiée</p>
          </div>
        )}
      </div>
    </Link>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default async function FormationsPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: formations }, { data: sessions }] = await Promise.all([
    supabase.from('formations').select('*').order('reference'),
    supabase
      .from('sessions')
      .select('*')
      .gte('date_debut', today)
      .order('date_debut'),
  ])

  const sessionsByFormation: Record<string, Session[]> = {}
  for (const s of sessions ?? []) {
    if (!sessionsByFormation[s.formation_id]) sessionsByFormation[s.formation_id] = []
    sessionsByFormation[s.formation_id].push(s)
  }

  const totalSessions = (sessions ?? []).length
  const placesDispos = (sessions ?? []).reduce((acc, s) => acc + s.places_restantes, 0)

  const [showModal, setShowModal] = useState(false)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#A0195B]" />
            Catalogue des formations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {(formations ?? []).length} formations · {totalSessions} sessions à venir · {placesDispos} places disponibles
          </p>
        </div>
      </div>

      {/* Grille formations */}
      {(formations ?? []).length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucune formation trouvée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {(formations as Formation[]).map(f => (
            <CarteFormation
              key={f.id}
              formation={f}
              sessions={sessionsByFormation[f.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  )
}
