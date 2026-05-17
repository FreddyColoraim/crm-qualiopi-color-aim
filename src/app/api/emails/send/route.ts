import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type EmailTemplate = 'devis' | 'convocation' | 'attestation' | 'relance' | 'custom'
interface SendEmailBody {
  to: string; toName: string; subject?: string; template: EmailTemplate
  variables?: Record<string, string>; candidatId?: string; formationId?: string
}

function buildHtml(template: EmailTemplate, vars: Record<string, string>): string {
  const base = (title: string, body: string) => `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f9f5f4;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <div style="background:#BE185D;padding:28px 36px">
    <div style="color:#fff;font-size:18px;font-weight:700">Color Aim</div>
    <div style="color:rgba(255,255,255,0.75);font-size:12px">Formation professionnelle — Certifié Qualiopi</div>
  </div>
  <div style="padding:36px">${body}</div>
  <div style="padding:20px 36px;background:#fdf2f8;border-top:1px solid #fce7f3;text-align:center">
    <p style="margin:0;color:#9ca3af;font-size:12px">Color Aim · maud@coloraim.fr · coloraim.fr</p>
  </div>
</div></body></html>`
  const p = (t: string) => `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.65">${t}</p>`
  const h2 = (t: string) => `<h2 style="margin:0 0 20px;color:#111827;font-size:20px;font-weight:700">${t}</h2>`
  const btn = (t: string, href: string) => `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#BE185D;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">${t}</a>`
  const row = (l: string, v: string) => `<tr><td style="padding:8px 12px;color:#6b7280;font-size:13px;width:140px">${l}</td><td style="padding:8px 12px;color:#111827;font-size:13px;font-weight:500">${v}</td></tr>`
  const tbl = (r: string) => `<table style="width:100%;border-collapse:collapse;margin:20px 0;background:#fdf2f8;border-radius:8px">${r}</table>`
  const prenom = vars.prenom ?? ''; const formation = vars.formation ?? 'Formation Color Aim'
  switch (template) {
    case 'devis': return base(`Devis — ${formation}`,
      h2(`Devis pour "${formation}"`) + p(`Bonjour ${prenom},`) +
      p(`Veuillez trouver ci-joint le devis pour <strong>${formation}</strong>.`) +
      tbl(row('Durée', vars.duree ?? '') + row('Prix HT', vars.prix ?? '') + row('Validité', '30 jours')) +
      btn('Signer le devis →', vars.lienSignature ?? '#'))
    case 'convocation': return base(`Convocation — ${formation}`,
      h2('Convocation à la formation') + p(`Bonjour ${prenom},`) +
      p(`Vous êtes convoqué(e) à <strong>${formation}</strong>.`) +
      tbl(row('Début', vars.dateDebut ?? '') + row('Fin', vars.dateFin ?? '') + row('Lieu', vars.lieu ?? 'Color Aim Studio') + row('Formateur', vars.formateur ?? 'Maud Batellier')) +
      btn('Télécharger la convocation →', vars.lienDocument ?? '#'))
    case 'attestation': return base(`Attestation — ${formation}`,
      h2('Attestation de formation') + p(`Bonjour ${prenom}, félicitations !`) +
      p(`Voici votre attestation pour <strong>${formation}</strong>.`) +
      tbl(row('Période', `${vars.dateDebut ?? ''} – ${vars.dateFin ?? ''}`) + row('Durée', vars.duree ?? '')) +
      btn("Télécharger l'attestation →", vars.lienDocument ?? '#'))
    case 'relance': return base('Rappel — Document en attente',
      h2('Document en attente de signature') + p(`Bonjour ${prenom},`) +
      p(`Votre <strong>${vars.document ?? 'document'}</strong> pour <strong>${formation}</strong> attend votre signature avant le <strong>${vars.dateLimit ?? ''}</strong>.`) +
      btn('Signer maintenant →', vars.lienSignature ?? '#'))
    default: return base(vars.subject ?? 'Message Color Aim',
      h2(vars.title ?? 'Message') + p(`Bonjour ${prenom},`) + p(vars.body ?? ''))
  }
}

function buildSubject(template: EmailTemplate, vars: Record<string, string>): string {
  const f = vars.formation ?? 'Formation Color Aim'
  switch (template) {
    case 'devis': return `[Color Aim] Votre devis — ${f}`
    case 'convocation': return `[Color Aim] Convocation — ${f}`
    case 'attestation': return `[Color Aim] Votre attestation — ${f}`
    case 'relance': return `[Color Aim] Rappel — Document en attente`
    default: return `[Color Aim] Message`
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: SendEmailBody = await req.json()
    const { to, toName, template, variables = {}, candidatId, formationId } = body
    if (!to || !template) return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    const apiKey = process.env.SENDGRID_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'SENDGRID_API_KEY manquante' }, { status: 500 })
    const subject = body.subject ?? buildSubject(template, variables)
    const html = buildHtml(template, { ...variables, prenom: toName })
    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to, name: toName }] }],
        from: { email: process.env.SENDGRID_FROM_EMAIL ?? 'maud@coloraim.fr', name: 'Maud — Color Aim' },
        subject, content: [{ type: 'text/html', value: html }],
        tracking_settings: { click_tracking: { enable: true }, open_tracking: { enable: true } },
      }),
    })
    if (!sgRes.ok && sgRes.status !== 202) {
      const err = await sgRes.text()
      return NextResponse.json({ error: 'Échec SendGrid', detail: err }, { status: 502 })
    }
    const supabase = await createClient()
    await supabase.from('emails').insert({
      candidat_id: candidatId ?? null, formation_id: formationId ?? null,
      destinataire: to, sujet: subject, template, statut: 'envoyé',
      sent_at: new Date().toISOString(),
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const candidatId = req.nextUrl.searchParams.get('candidatId')
  const supabase = await createClient()
  let query = supabase.from('emails').select('*').order('sent_at', { ascending: false }).limit(50)
  if (candidatId) query = query.eq('candidat_id', candidatId)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
