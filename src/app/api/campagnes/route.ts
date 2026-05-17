import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BREVO_API = 'https://api.brevo.com/v3'

async function brevoHeaders() {
  return {
    'api-key': process.env.BREVO_API_KEY ?? '',
    'Content-Type': 'application/json',
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('campagnes').select('*, formations(titre,reference)').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nom, type, canal, sujet, contenu, cible_metier, cible_source, formation_id, scheduled_at } = body
    const supabase = await createClient()

    // Récupérer les prospects ciblés
    let query = supabase.from('prospects').select('email,prenom,nom').neq('statut', 'inscrit')
    if (cible_metier?.length > 0) query = query.in('metier', cible_metier)
    if (cible_source?.length > 0) query = query.in('source', cible_source)
    const { data: prospects } = await query
    const nb = prospects?.length ?? 0

    // Créer en base
    const { data: campagne, error } = await supabase.from('campagnes').insert({
      nom, type: type ?? 'email', canal: canal ?? 'brevo', sujet, contenu,
      cible_metier, cible_source, formation_id: formation_id ?? null,
      nb_destinataires: nb, statut: scheduled_at ? 'planifiée' : 'brouillon',
      scheduled_at: scheduled_at ?? null, created_at: new Date().toISOString(),
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Envoi Brevo si demandé immédiatement
    if (canal === 'brevo' && process.env.BREVO_API_KEY && !scheduled_at) {
      const brevoRes = await fetch(`${BREVO_API}/emailCampaigns`, {
        method: 'POST',
        headers: await brevoHeaders(),
        body: JSON.stringify({
          name: nom,
          subject: sujet,
          htmlContent: contenu,
          sender: { name: 'Color Aim', email: process.env.BREVO_FROM_EMAIL ?? 'maud@coloraim.fr' },
          recipients: { listIds: [] },
          scheduledAt: scheduled_at,
        }),
      })
      if (brevoRes.ok) {
        const { id: brevoId } = await brevoRes.json()
        await supabase.from('campagnes').update({ brevo_campaign_id: String(brevoId), statut: 'envoyée', sent_at: new Date().toISOString() }).eq('id', campagne.id)
      }
    }

    return NextResponse.json({ success: true, campagne, nb_destinataires: nb }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}
