'use client'
import { useState } from 'react'

type DocType = 'presentation' | 'devis' | 'financement_opco' | 'convocation' | 'logistique' | 'exercices'

interface Props {
  candidatId: string
  formationId?: string
  inscriptionId?: string
  candidatNom: string
  candidatEmail: string
}

const DOCS: { type: DocType; label: string; icon: string; desc: string }[] = [
  { type: 'presentation',    icon: '📋', label: 'Présentation formation',  desc: 'Programme complet, objectifs, modalités' },
  { type: 'devis',           icon: '💶', label: 'Devis',                   desc: 'Proposition tarifaire avec signature' },
  { type: 'financement_opco',icon: '🏦', label: 'Fiche financement OPCO',  desc: 'Dossier de prise en charge' },
  { type: 'convocation',     icon: '📅', label: 'Convocation',             desc: 'Convocation officielle avec infos pratiques' },
  { type: 'logistique',      icon: '🗺️', label: 'Fiche logistique',        desc: 'Lieu, horaires, équipements' },
  { type: 'exercices',       icon: '✏️', label: 'Exercices pratiques',      desc: 'Travaux pratiques à compléter' },
]

export function DocumentHub({ candidatId, formationId, inscriptionId, candidatNom, candidatEmail }: Props) {
  const [show, setShow] = useState(false)
  const [generating, setGenerating] = useState<DocType | null>(null)
  const [sending, setSending] = useState<DocType | null>(null)
  const [statuts, setStatuts] = useState<Record<DocType, 'idle'|'generated'|'sent'>>({
    presentation: 'idle', devis: 'idle', financement_opco: 'idle',
    convocation: 'idle', logistique: 'idle', exercices: 'idle',
  })
  const [toast, setToast] = useState<string | null>(null)

  function showT(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  async function generate(type: DocType) {
    setGenerating(type)
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, candidatId, formationId, inscriptionId }),
      })
      if (!res.ok) { showT('Erreur génération'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}_${candidatNom.replace(' ','_')}.html`
      a.click()
      setStatuts(s => ({ ...s, [type]: 'generated' }))
      showT(`${DOCS.find(d => d.type === type)?.label} généré ✓`)
    } catch { showT('Erreur réseau') }
    setGenerating(null)
  }

  async function generateAndSend(type: DocType) {
    setSending(type)
    try {
      const genRes = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, candidatId, formationId, inscriptionId }),
      })
      if (!genRes.ok) { showT('Erreur génération'); setSending(null); return }
      const html = await genRes.text()

      const emailRes = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: candidatEmail, toName: candidatNom,
          template: 'custom',
          variables: {
            title: DOCS.find(d => d.type === type)?.label ?? 'Document',
            body: `Veuillez trouver ci-joint votre ${DOCS.find(d => d.type === type)?.label?.toLowerCase()}.`,
          },
          candidatId,
        }),
      })
      if (emailRes.ok) {
        setStatuts(s => ({ ...s, [type]: 'sent' }))
        showT(`Email envoyé à ${candidatEmail} ✓`)
      } else showT('Erreur envoi email')
    } catch { showT('Erreur réseau') }
    setSending(null)
  }

  return (
    <>
      {toast && <div style={{position:'fixed',top:24,right:24,zIndex:9999}} className="bg-[#BE185D] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">{toast}</div>}
      <button onClick={() => setShow(true)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors">
        📄 Documents
      </button>

      {show && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={() => setShow(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <div className="font-semibold text-gray-900">Documents · {candidatNom}</div>
                <div className="text-xs text-gray-400 mt-0.5">Générer ou envoyer un document</div>
              </div>
              <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="p-6 space-y-3">
              {DOCS.map(doc => (
                <div key={doc.type} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                  <span className="text-2xl flex-shrink-0">{doc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{doc.label}</div>
                    <div className="text-xs text-gray-400">{doc.desc}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {statuts[doc.type] === 'sent' && <span className="text-xs text-green-600 font-medium">✓ Envoyé</span>}
                    {statuts[doc.type] === 'generated' && <span className="text-xs text-blue-600 font-medium">✓ Généré</span>}
                    <button
                      onClick={() => generate(doc.type)}
                      disabled={generating === doc.type}
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                    >
                      {generating === doc.type ? '⏳' : '⬇ Générer'}
                    </button>
                    <button
                      onClick={() => generateAndSend(doc.type)}
                      disabled={sending === doc.type || !candidatEmail}
                      className="px-3 py-1.5 bg-[#BE185D] text-white rounded-lg text-xs font-medium hover:bg-[#9d1550] transition-colors disabled:opacity-40"
                    >
                      {sending === doc.type ? '⏳' : '✉ Envoyer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 pb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                ⬇ Générer télécharge le document HTML (imprimable en PDF via Cmd+P)<br/>
                ✉ Envoyer génère et envoie par email via Brevo/SendGrid
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
