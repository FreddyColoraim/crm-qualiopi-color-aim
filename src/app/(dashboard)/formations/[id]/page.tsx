import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Clock, Users, MapPin, Euro, BookOpen,
  CalendarDays, CheckCircle2, AlertCircle, XCircle, Info
} from 'lucide-react'

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
  programme: string | null
  delai_acces_jours: number | null
}

interface Session {
  id: string
  date_debut: string
  date_fin: string
  places_restantes: number
  places_max: number
  statut: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatDateCourt(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

function SessionCard({ session }: { session: Session }) {
  const complet = session.places_restantes === 0
  const presque = session.places_restantes <= Math.ceil(session.places_max * 0.33)

  const statutConfig: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string }> = {
    confirmée:        { icon: <CheckCircle2 className="w-4 h-4" />, bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    planifiée:        { icon: <CalendarDays className="w-4 h-4" />,  bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-200' },
    complet:          { icon: <XCircle className="w-4 h-4" />,       bg: 'bg-red-50',   text: 'text-red-700',   border: 'border-red-200' },
    'presque complet':{ icon: <AlertCircle className="w-4 h-4" />,   bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  }
  const cfg = statutConfig[session.statut] ?? statutConfig['planifiée']

  return (
    <div className={`border rounded-xl p-4 ${cfg.border} ${cfg.bg}`}>
      <div className="flex items-start justify-between gap-4">
        {/* Dates */}
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <CalendarDays className="w-4 h-4 text-[#A0195B]" />
            {formatDate(session.date_debut)}
          </div>
          {session.date_debut !== session.date_fin && (
            <div className="text-xs text-gray-500 mt-0.5 ml-6">
              jusqu&apos;au {formatDateCourt(session.date_fin)}
            </div>
          )}
        </div>

        {/* Statut + places */}
        <div className="text-right flex-shrink-0">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {cfg.icon}
            {session.statut}
          </span>
          <p className={`text-xs font-semibold mt-1 ${complet ? 'text-red-600' : presque ? 'text-amber-600' : 'text-green-600'}`}>
            {session.places_restantes}/{session.places_max} places
          </p>
        </div>
      </div>

      {/* Barre de remplissage */}
      <div className="mt-3 h-1.5 bg-white/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${complet ? 'bg-red-400' : presque ? 'bg-amber-400' : 'bg-green-400'}`}
          style={{ width: `${((session.places_max - session.places_restantes) / session.places_max) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function FormationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: formation }, { data: sessions }] = await Promise.all([
    supabase.from('formations').select('*').eq('id', id).single(),
    supabase
      .from('sessions')
      .select('*')
      .eq('formation_id', id)
      .gte('date_debut', today)
      .order('date_debut'),
  ])

  if (!formation) notFound()

  const f = formation as Formation
  const lignesProgramme = f.programme?.split('\n').filter(Boolean) ?? []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Retour */}
      <Link
        href="/formations"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#A0195B] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au catalogue
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Colonne principale ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Titre */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <span className="text-xs font-mono text-[#A0195B] bg-[#FEE7F0] px-2 py-0.5 rounded">
              {f.reference}
            </span>
            <h1 className="text-xl font-semibold text-gray-900 mt-3 mb-2">{f.titre}</h1>
            {f.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
            )}

            {/* Infos rapides */}
            <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-100">
              {f.duree && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4 text-[#A0195B]" />
                  <span>{f.duree}</span>
                </div>
              )}
              {f.effectif && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Users className="w-4 h-4 text-[#A0195B]" />
                  <span>{f.effectif}</span>
                </div>
              )}
              {f.modalites && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <MapPin className="w-4 h-4 text-[#A0195B]" />
                  <span>{f.modalites}</span>
                </div>
              )}
              {f.prix !== null && (
                <div className="flex items-center gap-2 text-sm font-semibold text-[#A0195B]">
                  <Euro className="w-4 h-4" />
                  <span>{f.prix.toLocaleString('fr-FR')} € HT / pers.</span>
                </div>
              )}
            </div>
          </div>

          {/* Programme */}
          {lignesProgramme.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-[#A0195B]" />
                Programme
              </h2>
              <div className="space-y-3">
                {lignesProgramme.map((ligne, i) => {
                  const estJour = ligne.toLowerCase().startsWith('jour') || ligne.toLowerCase().startsWith('matin') || ligne.toLowerCase().startsWith('après')
                  return estJour ? (
                    <div key={i} className="text-sm font-semibold text-[#A0195B] pt-2 first:pt-0">
                      {ligne.split(':')[0]}
                      {ligne.includes(':') && (
                        <span className="font-normal text-gray-600"> :{ligne.split(':').slice(1).join(':')}</span>
                      )}
                    </div>
                  ) : (
                    <p key={i} className="text-sm text-gray-600 pl-3 border-l-2 border-[#FEE7F0]">
                      {ligne}
                    </p>
                  )
                })}
              </div>
            </div>
          )}

          {/* Public & prérequis */}
          {(f.public_cible || f.prerequis) && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Info className="w-4 h-4 text-[#A0195B]" />
                Public & prérequis
              </h2>
              {f.public_cible && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Public cible</p>
                  <p className="text-sm text-gray-700">{f.public_cible}</p>
                </div>
              )}
              {f.prerequis && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Prérequis</p>
                  <p className="text-sm text-gray-700">{f.prerequis}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Colonne sessions ── */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-6">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <CalendarDays className="w-4 h-4 text-[#A0195B]" />
              Sessions à venir
              <span className="ml-auto text-xs text-gray-400 font-normal">
                {(sessions ?? []).length} session{(sessions ?? []).length > 1 ? 's' : ''}
              </span>
            </h2>

            {(sessions ?? []).length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Aucune session planifiée</p>
                <p className="text-xs text-gray-400 mt-1">Contactez-nous pour organiser une session</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(sessions as Session[]).map(s => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            )}

            {/* Délai d'accès */}
            {f.delai_acces_jours && (
              <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100 text-center">
                Délai d&apos;accès : {f.delai_acces_jours} jours avant le début de session
              </p>
            )}

            {/* Contact */}
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500 mb-2">Pour toute inscription ou question</p>
              <a
                href="mailto:maud@coloraim.fr"
                className="inline-flex items-center justify-center w-full gap-2 text-sm font-medium bg-[#A0195B] text-white px-4 py-2.5 rounded-xl hover:bg-[#8A1548] transition-colors"
              >
                Contacter Maud Batellier
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
