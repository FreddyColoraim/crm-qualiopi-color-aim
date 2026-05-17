import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const search = req.nextUrl.searchParams.get('q') ?? ''
  let query = supabase.from('formations').select('*, sessions(id,date_debut,date_fin,places_max,places_restantes,statut), formateurs(id,prenom,nom,specialite)').order('reference')
  if (search) query = query.ilike('titre', `%${search}%`)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { titre, type = 'formation', categorie, duree_heures, modalite = 'Présentiel', prix_ht,
      description, objectifs_pedagogiques, programme, public_cible, prerequis,
      methodes_pedagogiques, moyens_evaluation, accessibilite_handicap, delai_acces,
      formateur_id, sessions_initiales } = body
    if (!titre || !duree_heures || !prix_ht)
      return NextResponse.json({ error: 'Champs requis : titre, duree_heures, prix_ht' }, { status: 400 })
    const supabase = await createClient()
    const year = new Date().getFullYear()
    const { count } = await supabase.from('formations').select('*', { count: 'exact', head: true })
    const ref = `${type === 'atelier' ? 'AT' : 'CA'}-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`
    const { data: formation, error: fErr } = await supabase.from('formations').insert({
      titre, reference: ref, type, categorie: categorie ?? 'Arts graphiques',
      duree_heures: Number(duree_heures), modalite, prix_ht: Number(prix_ht), prix_ttc: Number(prix_ht) * 1.2,
      description, objectifs_pedagogiques, programme, public_cible, prerequis,
      methodes_pedagogiques, moyens_evaluation,
      accessibilite_handicap: accessibilite_handicap ?? 'Locaux accessibles PMR.',
      delai_acces: delai_acces ?? '7 jours ouvrés',
      formateur_id: formateur_id ?? null, statut: 'active', created_at: new Date().toISOString(),
    }).select().single()
    if (fErr) return NextResponse.json({ error: fErr.message }, { status: 500 })
    if (sessions_initiales?.length > 0) {
      await supabase.from('sessions').insert(
        sessions_initiales.map((s: { date_debut: string; date_fin: string; places_max?: number }) => ({
          formation_id: formation.id, date_debut: s.date_debut, date_fin: s.date_fin,
          places_max: s.places_max ?? 8, places_restantes: s.places_max ?? 8, statut: 'planifiée',
        }))
      )
    }
    return NextResponse.json({ success: true, formation }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}
