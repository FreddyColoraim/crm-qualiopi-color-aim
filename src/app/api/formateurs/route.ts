import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('formateurs').select('*, formations(id,titre,reference,statut)').order('nom')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const { prenom, nom, email, telephone, specialite, bio, diplomes, experience_ans, cv_url, photo_url, siret, statut = 'actif' } = await req.json()
    if (!prenom || !nom || !email)
      return NextResponse.json({ error: 'Champs requis : prenom, nom, email' }, { status: 400 })
    const supabase = await createClient()
    const { data, error } = await supabase.from('formateurs').insert({
      prenom, nom, email, telephone, specialite, bio,
      diplomes: Array.isArray(diplomes) ? diplomes.join('\n') : diplomes,
      experience_ans: Number(experience_ans) || 0, cv_url, photo_url, siret, statut,
      created_at: new Date().toISOString(),
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, formateur: data }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}
