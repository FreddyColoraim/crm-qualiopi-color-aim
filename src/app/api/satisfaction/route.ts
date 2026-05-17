import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BREVO_API = 'https://api.brevo.com/v3'

// GET — stats globales
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('questionnaires_satisfaction')
    .select('*, candidats(prenom,nom), formations(titre,reference)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const repondus = (data ?? []).filter(q => q.repondu_at)
  const nps = repondus.length > 0
    ? Math.round(repondus.reduce((a, q) => a + (q.note_globale ?? 0), 0) / repondus.length * 10) / 10
    : null
  return NextResponse.json({ questionnaires: data, nps, total: data?.length, repondus: repondus.length })
}

// POST — envoyer questionnaire via Brevo
export async function POST(req: NextRequest) {
  try {
    const { candidat_id, formation_id, candidat_email, candidat_nom } = await req.json()
    const supabase = await createClient()

    // Créer le questionnaire en base
    const { data: qs, error } = await supabase.from('questionnaires_satisfaction').insert({
      candidat_id, formation_id, created_at: new Date().toISOString(),
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const lienQuestionnaire = `${process.env.NEXT_PUBLIC_APP_URL}/satisfaction/${qs.id}`

    // Envoi email via Brevo
    if (process.env.BREVO_API_KEY) {
      await fetch(`${BREVO_API}/smtp/email`, {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Color Aim', email: process.env.BREVO_FROM_EMAIL ?? 'maud@coloraim.fr' },
          to: [{ email: candidat_email, name: candidat_nom }],
          subject: '[Color Aim] Votre avis sur la formation',
          htmlContent: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
              <div style="background:#BE185D;padding:24px;border-radius:12px 12px 0 0">
                <h1 style="color:#fff;margin:0;font-size:20px">Color Aim</h1>
              </div>
              <div style="padding:32px;background:#fff">
                <h2 style="color:#111">Bonjour ${candidat_nom},</h2>
                <p style="color:#374151">Merci d'avoir suivi notre formation. Votre avis nous est précieux pour améliorer nos programmes.</p>
                <p style="color:#374151">Cela prend moins de 2 minutes !</p>
                <a href="${lienQuestionnaire}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#BE185D;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
                  Donner mon avis →
                </a>
              </div>
            </div>`,
        }),
      })
      await supabase.from('questionnaires_satisfaction').update({ brevo_sent_at: new Date().toISOString() }).eq('id', qs.id)
    }

    return NextResponse.json({ success: true, lien: lienQuestionnaire, id: qs.id })
  } catch { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}
