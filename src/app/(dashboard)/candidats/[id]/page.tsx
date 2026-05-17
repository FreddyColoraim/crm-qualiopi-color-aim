import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EmailButtonWrapper } from '@/components/EmailButtonWrapper'
import {
  ArrowLeft, Mail, Phone, Building2, Briefcase,
  CreditCard, FileText, CalendarDays, CheckCircle2,
  Clock, XCircle, Send, FileSignature, Hash
} from 'lucide-react'

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

interface Formation {
  id: string
  titre: string
  reference: string
  prix: number | null
}

interface Session {
  id: string
  date_debut: string
  date_fin: string
  statut: string
}

interface Document {
  id: string
  type: string
  nom: string
  statut: string
  date_envoi: string | null
  date_validation: string | null
  lien_signature: string | null
}

interface DemandeOPCO {
  id: string
  type_financement: string
  montant: number
  statut: string
  reference: string | null
  date_demande: string
  date_reponse: string | null
}

interface Inscription {
  id: string
  statut: string
  date_inscription: string
  date_validation: string | null
  formation: Formation
  session: Session | null
  documents: Document[]
  demandes_opco: DemandeOPCO[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function statutInscriptionCfg(statut: string) {
  const map: Record<string, { cls: string; label: string }> = {
    validée:     { cls: 'bg-green-50 text-green-700 border-green-200', label: '✅ Validée' },
    'en attente':{ cls: 'bg-amber-50 text-amber-700 border-amber-200', label: '⏳ En attente' },
    annulée:     { cls: 'bg-red-50 text-red-700 border-red-200',       label: '❌ Annulée' },
  }
  return map[statut] ?? { cls: 'bg-gray-100 text-gray-600 border-gray-200', label: statut }
}

function statutDocIcon(statut: string) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    'validé':                { icon: <CheckCircle2 className="w-4 h-4" />, cls: 'text-green-600' },
    'envoyé':                { icon: <Send className="w-4 h-4" />,         cls: 'text-blue-600' },
    'en attente de signature':{ icon: <FileSignature className="w-4 h-4" />, cls: 'text-amber-600' },
    'non envoyé':            { icon: <Clock className="w-4 h-4" />,        cls: 'text-gray-400' },
    'refusé':                { icon: <XCircle className="w-4 h-4" />,      cls: 'text-red-600' },
  }
  return map[statut] ?? { icon: <FileText className="w-4 h-4" />, cls: 'text-gray-400' }
}

function statutOPCOCfg(statut: string) {
  const map: Record<string, string> = {
    validée:     'bg-green-50 text-green-700 border-green-200',
    'en attente':'bg-amber-50 text-amber-700 border-amber-200',
    refusée:     'bg-red-50 text-red-700 border-red-200',
  }
  return map[statut] ?? 'bg-gray-100 text-gray-600 border-gray-200'
}

const financeurColors: Record<string, string> = {
  'AFDAS':        'bg-purple-50 text-purple-700',
  'FAFCEA':       'bg-blue-50 text-blue-700',
  "L'Opcommerce": 'bg-green-50 text-green-700',
  'OPCO 2i':      'bg-orange-50 text-orange-700',
  'CPF':          'bg-pink-50 text-pink-700',
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function CandidatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: candidat } = await supabase
    .from('candidats')
    .select('*')
    .eq('id', id)
    .single()

  if (!candidat) notFound()

  const { data: inscriptionsRaw } = await supabase
    .from('inscriptions')
    .select(`
      id, statut, date_inscription, date_validation,
      formation:formations(id, titre, reference, prix),
      session:sessions(id, date_debut, date_fin, statut),
      documents(id, type, nom, statut, date_envoi, date_validation, lien_signature),
      demandes_opco(id, type_financement, montant, statut, reference, date_demande, date_reponse)
    `)
    .eq('candidat_id', id)
    .order('date_inscription', { ascending: false })

  const c = candidat as Candidat
  const inscriptions = (inscriptionsRaw ?? []) as unknown as Inscription[]
  const initiales = `${c.prenom[0]}${c.nom[0]}`.toUpperCase()
  const financeurCls = financeurColors[c.financeur ?? ''] ?? 'bg-gray-100 text-gray-600'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Retour */}
      <Link
        href="/candidats"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#A0195B] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux candidats
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Colonne gauche — profil ── */}
        <div className="space-y-4">

          {/* Carte identité */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-full bg-[#FEE7F0] text-[#A0195B] font-bold text-xl flex items-center justify-center mb-3">
                {initiales}
              </div>
              <h1 className="text-lg font-semibold text-gray-900">
                {c.prenom} {c.nom}
              </h1>
              {c.numero_dossier && (
                <span className="text-xs font-mono text-gray-400 mt-0.5">
                  {c.numero_dossier}
                </span>
              )}
              {c.financeur && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full mt-2 ${financeurCls}`}>
                  {c.financeur}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <a href={`mailto:${c.email}`} className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-[#A0195B] transition-colors">
                <Mail className="w-4 h-4 text-[#A0195B] flex-shrink-0" />
                <span className="truncate">{c.email}</span>
              </a>
              {c.telephone && (
                <a href={`tel:${c.telephone}`} className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-[#A0195B] transition-colors">
                  <Phone className="w-4 h-4 text-[#A0195B] flex-shrink-0" />
                  {c.telephone}
                </a>
              )}
              {c.entreprise && (
                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                  <Building2 className="w-4 h-4 text-[#A0195B] flex-shrink-0" />
                  {c.entreprise}
                </div>
              )}
              {c.poste && (
                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                  <Briefcase className="w-4 h-4 text-[#A0195B] flex-shrink-0" />
                  {c.poste}
                </div>
              )}
            </div>
          </div>

          {/* Stats rapides */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Résumé</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Inscriptions</span>
                <span className="font-semibold text-gray-900">{inscriptions.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Documents</span>
                <span className="font-semibold text-gray-900">
                  {inscriptions.reduce((a, i) => a + i.documents.length, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Demandes OPCO</span>
                <span className="font-semibold text-gray-900">
                  {inscriptions.reduce((a, i) => a + i.demandes_opco.length, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Colonne droite — inscriptions ── */}
        <div className="lg:col-span-2 space-y-5">
          {inscriptions.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <CalendarDays className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm">Aucune inscription enregistrée</p>
            </div>
          ) : (
            inscriptions.map(insc => {
              const statutCfg = statutInscriptionCfg(insc.statut)
              return (
                <div key={insc.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  {/* Header inscription */}
                  <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-mono text-[#A0195B] bg-[#FEE7F0] px-1.5 py-0.5 rounded mb-1 inline-block">
                        {insc.formation.reference}
                      </p>
                      <h2 className="text-base font-semibold text-gray-900">{insc.formation.titre}</h2>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>Inscrit le {formatDate(insc.date_inscription)}</span>
                        {insc.session && (
                          <span>· Session {formatDate(insc.session.date_debut)} → {formatDate(insc.session.date_fin)}</span>
                        )}
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${statutCfg.cls}`}>
                      {statutCfg.label}
                    </span>
                  </div>

                  {/* Documents */}
                  {insc.documents.length > 0 && (
                    <div className="px-6 py-4 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Documents</p>
                      <div className="space-y-2">
                        {insc.documents.map(doc => {
                          const { icon, cls } = statutDocIcon(doc.statut)
                          return (
                            <div key={doc.id} className="flex items-center gap-3">
                              <span className={cls}>{icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 truncate">{doc.nom}</p>
                                <p className="text-xs text-gray-400">
                                  {doc.statut}
                                  {doc.date_envoi && ` · Envoyé le ${formatDate(doc.date_envoi)}`}
                                  {doc.date_validation && ` · Validé le ${formatDate(doc.date_validation)}`}
                                </p>
                              </div>
                              {doc.lien_signature && (
                                <a
                                  href={doc.lien_signature}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-[#A0195B] hover:underline flex-shrink-0"
                                >
                                  Signer
                                </a>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Demandes OPCO */}
                  {insc.demandes_opco.length > 0 && (
                    <div className="px-6 py-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Financement OPCO</p>
                      <div className="space-y-2">
                        {insc.demandes_opco.map(d => (
                          <div key={d.id} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-[#A0195B]" />
                              <div>
                                <p className="text-sm font-medium text-gray-700">{d.type_financement}</p>
                                {d.reference && (
                                  <p className="text-xs font-mono text-gray-400">{d.reference}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {d.montant.toLocaleString('fr-FR')} €
                              </p>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${statutOPCOCfg(d.statut)}`}>
                                {d.statut}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
