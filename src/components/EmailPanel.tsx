'use client'
import { useState } from 'react'

type EmailTemplate = 'devis' | 'convocation' | 'attestation' | 'relance' | 'custom'

interface Props {
  candidatId: string; candidatNom: string; candidatEmail: string
  formation?: string; formationId?: string
  dateDebut?: string; dateFin?: string; duree?: string; prix?: string
  lienSignature?: string; lienDocument?: string
}

export function EmailPanel({ candidatId, candidatNom, candidatEmail, formation, formationId, dateDebut, dateFin, duree, prix, lienSignature, lienDocument }: Props) {
  const [show, setShow] = useState(false)
  const [tpl, setTpl] = useState<EmailTemplate>('devis')
  const [customSubject, setCustomSubject] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<'sent' | 'error' | null>(null)

  const variables = {
    formation: formation ?? '', duree: duree ?? '', prix: prix ? `${prix} € HT` : '',
    dateDebut: dateDebut ?? '', dateFin: dateFin ?? '',
    lienSignature: lienSignature ?? '#', lienDocument: lienDocument ?? '#',
    formateur: 'Maud Batellier', lieu: 'Color Aim Studio',
  }

  const templates: { id: EmailTemplate; label: string; icon: string; desc: string }[] = [
    { id: 'devis',       icon: '📄', label: 'Devis',       desc: 'Envoyer le devis pour signature' },
    { id: 'convocation', icon: '📅', label: 'Convocation', desc: 'Convoquer à la session' },
    { id: 'attestation', icon: '🎓', label: 'Attestation', desc: 'Attestation de fin de formation' },
    { id: 'relance',     icon: '🔔', label: 'Relance',     desc: 'Relancer un document non signé' },
    { id: 'custom',      icon: '✏️', label: 'Libre',       desc: 'Email personnalisé' },
  ]

  async function send() {
    setSending(true); setResult(null)
    try {
      const body: Record<string, unknown> = { to: candidatEmail, toName: candidatNom, template: tpl, variables, candidatId, formationId }
      if (tpl === 'custom') { body.subject = customSubject; body.variables = { ...variables, title: customSubject, body: customBody } }
      const r = await fetch('/api/emails/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      setResult(r.ok ? 'sent' : 'error')
      if (r.ok) setTimeout(() => { setShow(false); setResult(null) }, 1500)
    } catch { setResult('error') } finally { setSending(false) }
  }

  return (
    <>
      <button onClick={() => setShow(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#BE185D] text-white rounded-xl text-sm font-medium hover:bg-[#9d1550] transition-colors">
        ✉ Documents & Emails
      </button>
      {show && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={() => setShow(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <div className="font-semibold text-gray-900 text-sm">Envoyer un email</div>
                <div className="text-xs text-gray-400 mt-0.5">→ {candidatNom} · {candidatEmail}</div>
              </div>
              <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="px-6 py-4 space-y-2">
              {templates.map(t => (
                <button key={t.id} onClick={() => setTpl(t.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${tpl === t.id ? 'bg-[#fdf2f8] border border-[#BE185D]/30' : 'border border-gray-100 hover:bg-gray-50'}`}>
                  <span className="text-lg">{t.icon}</span>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${tpl === t.id ? 'text-[#BE185D]' : 'text-gray-800'}`}>{t.label}</div>
                    <div className="text-xs text-gray-400">{t.desc}</div>
                  </div>
                  {tpl === t.id && <span className="text-[#BE185D]">✓</span>}
                </button>
              ))}
              {tpl === 'custom' && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Sujet</label>
                    <input className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30" value={customSubject} onChange={e => setCustomSubject(e.target.value)} placeholder="Objet…" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Message</label>
                    <textarea rows={4} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30 resize-none" value={customBody} onChange={e => setCustomBody(e.target.value)} placeholder="Bonjour, …" />
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              {result === 'sent' && <div className="text-center text-green-600 text-sm font-medium mb-3">✓ Email envoyé !</div>}
              {result === 'error' && <div className="text-center text-red-500 text-sm mb-3">Erreur — vérifiez la clé SendGrid.</div>}
              <div className="flex gap-3">
                <button onClick={() => setShow(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
                <button onClick={send} disabled={sending} className="flex-1 py-2.5 bg-[#BE185D] text-white rounded-xl text-sm font-medium hover:bg-[#9d1550] transition-colors disabled:opacity-40">
                  {sending ? '↻ Envoi…' : '✉ Envoyer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
