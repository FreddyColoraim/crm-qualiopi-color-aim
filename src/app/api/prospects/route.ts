import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const statut = req.nextUrl.searchParams.get('statut')
  const source = req.nextUrl.searchParams.get('source')
  const metier = req.nextUrl.searchParams.get('metier')
  const q = req.nextUrl.searchParams.get('q')
  let query = supabase.from('prospects').select('*').order('created_at', { ascending: false })
  if (statut) query = query.eq('statut', statut)
  if (source) query = query.eq('source', source)
  if (metier) query = query.eq('metier', metier)
  if (q) query = query.or(`nom.ilike.%${q}%,email.ilike.%${q}%,prenom.ilike.%${q}%`)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Import CSV en masse
    if (Array.isArray(body)) {
      const supabase = await createClient()
      const { data, error } = await supabase.from('prospects').upsert(
        body.map((p: Record<string, string>) => ({ ...p, source: p.source ?? 'csv' })),
        { onConflict: 'email', ignoreDuplicates: true }
      ).select()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, count: data.length }, { status: 201 })
    }
    // Ajout unitaire
    const supabase = await createClient()
    const { data, error } = await supabase.from('prospects').insert(body).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, prospect: data }, { status: 201 })
  } catch { return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json()
  const supabase = await createClient()
  const { error } = await supabase.from('prospects').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
