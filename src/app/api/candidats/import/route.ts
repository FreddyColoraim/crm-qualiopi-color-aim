import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json()
    if (!Array.isArray(rows) || rows.length === 0)
      return NextResponse.json({ error: 'Aucune ligne valide' }, { status: 400 })

    const supabase = await createClient()
    let importes = 0; let erreurs = 0
    const details: string[] = []

    for (const row of rows) {
      const { nom, prenom, email, telephone, entreprise, financeur, poste, metier, notes } = row
      if (!nom || !email) { erreurs++; details.push(`Ligne ignorée : nom ou email manquant (${email ?? '?'})`); continue }

      const { error } = await supabase.from('candidats').upsert({
        nom: nom.trim(),
        prenom: prenom?.trim() ?? '',
        email: email.trim().toLowerCase(),
        telephone: telephone?.trim() ?? null,
        entreprise: entreprise?.trim() ?? null,
        poste: poste?.trim() ?? null,
        financeur: financeur?.trim() ?? null,
        metier: metier?.trim() ?? null,
        notes: notes?.trim() ?? null,
        statut: 'prospect',
      }, { onConflict: 'email', ignoreDuplicates: false })

      if (error) { erreurs++; details.push(`Erreur ${email} : ${error.message}`) }
      else importes++
    }

    const supabase2 = await createClient()
    await supabase2.from('imports_csv').insert({
      nom_fichier: 'import.csv', nb_lignes: rows.length, nb_importes: importes, nb_erreurs: erreurs,
    })

    return NextResponse.json({ success: true, importes, erreurs, details })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
