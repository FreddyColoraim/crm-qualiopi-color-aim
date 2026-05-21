import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type DocType = 'presentation' | 'devis' | 'financement_opco' | 'convocation' | 'logistique' | 'exercices'

function buildDocHtml(type: DocType, data: Record<string, string>): string {
  const {
    candidatNom = '', candidatPrenom = '', candidatEmail = '',
    candidatEntreprise = '', candidatFinanceur = '',
    formationTitre = '', formationRef = '', formationDuree = '',
    formationPrix = '', formationModalite = '', formationObjectifs = '',
    formationProgramme = '', formationPublic = '', formationPrerequis = '',
    sessionDebut = '', sessionFin = '', sessionLieu = '', sessionHoraires = '9h – 17h',
    formateur = 'Maud Batellier', organismeNom = 'Color Aim',
    organismeEmail = 'maud@coloraim.fr', organismeTel = '06 12 34 56 78',
    organismeAdresse = 'Bordeaux, France', organismeQualiopi = 'N° xxxxxxxxxxxx',
  } = data

  const header = `
    <div style="background:#BE185D;padding:24px 36px;display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:0.02em">${organismeNom}</div>
        <div style="color:rgba(255,255,255,0.75);font-size:11px;margin-top:2px">Formation professionnelle · Certifié Qualiopi ${organismeQualiopi}</div>
      </div>
      <div style="text-align:right;color:rgba(255,255,255,0.8);font-size:11px">
        <div>${organismeEmail}</div>
        <div>${organismeTel}</div>
        <div>${organismeAdresse}</div>
      </div>
    </div>`

  const footer = `
    <div style="position:fixed;bottom:0;left:0;right:0;background:#fdf2f8;padding:12px 36px;border-top:1px solid #fce7f3;display:flex;justify-content:space-between;font-size:10px;color:#9ca3af">
      <span>${organismeNom} · ${organismeQualiopi}</span>
      <span>Document généré le ${new Date().toLocaleDateString('fr-FR')}</span>
    </div>`

  const section = (title: string, content: string) =>
    `<div style="margin-bottom:20px"><div style="font-size:13px;font-weight:700;color:#BE185D;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;padding-bottom:4px;border-bottom:2px solid #fce7f3">${title}</div>${content}</div>`

  const field = (label: string, value: string) =>
    `<div style="display:flex;gap:8px;margin-bottom:6px"><span style="font-size:12px;color:#6b7280;min-width:140px">${label}</span><span style="font-size:12px;color:#111827;font-weight:500">${value || '—'}</span></div>`

  const base = (title: string, body: string) => `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<style>
  * { margin:0;padding:0;box-sizing:border-box; }
  body { font-family: Arial, sans-serif; color: #374151; }
  .page { padding: 0 0 60px 0; }
  .content { padding: 28px 36px; }
  h1 { font-size:20px;font-weight:700;color:#111827;margin-bottom:6px; }
  .subtitle { font-size:13px;color:#6b7280;margin-bottom:24px; }
</style>
</head><body>
<div class="page">
  ${header}
  <div class="content">
    <h1>${title}</h1>
    ${body}
  </div>
  ${footer}
</div>
</body></html>`

  switch (type) {
    case 'presentation':
      return base(`Présentation · ${formationTitre}`,
        `<div class="subtitle">Programme de formation — ${organismeNom}</div>` +
        section('La formation', field('Référence', formationRef) + field('Durée', formationDuree) + field('Modalité', formationModalite) + field('Prix HT', formationPrix ? `${formationPrix} € HT` : '') + field('Formateur', formateur)) +
        section('Objectifs pédagogiques', `<p style="font-size:12px;line-height:1.7;color:#374151">${formationObjectifs || 'À préciser'}</p>`) +
        section('Programme', `<p style="font-size:12px;line-height:1.7;color:#374151;white-space:pre-line">${formationProgramme || 'À préciser'}</p>`) +
        section('Public & Prérequis', field('Public cible', formationPublic) + field('Prérequis', formationPrerequis)) +
        section('Organisme', field('Certification', `Qualiopi ${organismeQualiopi}`) + field('Contact', organismeEmail) + field('Téléphone', organismeTel))
      )

    case 'devis':
      const prixHT = parseFloat(formationPrix) || 0
      const tva = prixHT * 0.2
      const prixTTC = prixHT + tva
      return base(`Devis · ${formationTitre}`,
        `<div class="subtitle">Proposition commerciale pour ${candidatPrenom} ${candidatNom}</div>` +
        section('Destinataire', field('Nom', `${candidatPrenom} ${candidatNom}`) + field('Email', candidatEmail) + field('Entreprise', candidatEntreprise) + field('Financeur', candidatFinanceur)) +
        section('Formation', field('Intitulé', formationTitre) + field('Référence', formationRef) + field('Durée', formationDuree) + field('Modalité', formationModalite) + field('Dates', sessionDebut && sessionFin ? `${sessionDebut} → ${sessionFin}` : 'À définir')) +
        section('Tarif', `
          <table style="width:100%;border-collapse:collapse;margin-top:4px">
            <tr style="background:#fdf2f8"><td style="padding:8px 12px;font-size:12px;font-weight:600;color:#BE185D">Montant HT</td><td style="padding:8px 12px;font-size:12px;text-align:right;font-weight:700;color:#111">${prixHT.toFixed(2)} €</td></tr>
            <tr><td style="padding:8px 12px;font-size:12px;color:#6b7280">TVA (20%) — Formation professionnelle exonérée</td><td style="padding:8px 12px;font-size:12px;text-align:right;color:#6b7280">0,00 €</td></tr>
            <tr style="background:#BE185D"><td style="padding:8px 12px;font-size:13px;font-weight:700;color:#fff">Total TTC</td><td style="padding:8px 12px;font-size:13px;text-align:right;font-weight:700;color:#fff">${prixHT.toFixed(2)} €</td></tr>
          </table>
          <p style="font-size:11px;color:#9ca3af;margin-top:8px">Devis valable 30 jours. Les organismes de formation sont exonérés de TVA (art. 261-4-4° du CGI).</p>`) +
        section('Conditions', field('Validité', '30 jours'), ) +
        `<div style="margin-top:32px;display:flex;gap:48px"><div style="text-align:center"><div style="font-size:11px;color:#6b7280;margin-bottom:40px">Signature du client</div><div style="border-top:1px solid #e5e7eb;padding-top:8px;font-size:11px;color:#6b7280">${candidatPrenom} ${candidatNom}</div></div><div style="text-align:center"><div style="font-size:11px;color:#6b7280;margin-bottom:40px">Signature ${organismeNom}</div><div style="border-top:1px solid #e5e7eb;padding-top:8px;font-size:11px;color:#6b7280">${formateur}</div></div></div>`
      )

    case 'financement_opco':
      return base(`Fiche financement OPCO · ${formationTitre}`,
        `<div class="subtitle">Dossier de prise en charge — ${candidatFinanceur || 'OPCO'}</div>` +
        section('Stagiaire', field('Nom', `${candidatPrenom} ${candidatNom}`) + field('Email', candidatEmail) + field('Entreprise', candidatEntreprise) + field('Financeur OPCO', candidatFinanceur)) +
        section('Formation', field('Intitulé', formationTitre) + field('Référence', formationRef) + field('Durée', formationDuree) + field('Modalité', formationModalite) + field('Dates', sessionDebut && sessionFin ? `${sessionDebut} → ${sessionFin}` : 'À définir') + field('Coût pédagogique HT', formationPrix ? `${formationPrix} € HT` : '')) +
        section('Organisme de formation', field('Raison sociale', organismeNom) + field('N° Qualiopi', organismeQualiopi) + field('Contact', `${organismeEmail} · ${organismeTel}`)) +
        section('Documents à joindre au dossier OPCO', `
          <ul style="font-size:12px;color:#374151;line-height:2;padding-left:16px">
            <li>Convention de formation signée</li>
            <li>Programme détaillé de la formation</li>
            <li>CV du formateur</li>
            <li>Attestation Qualiopi</li>
            <li>RIB de l'organisme</li>
          </ul>`) +
        `<div style="background:#fdf2f8;border:1px solid #fce7f3;border-radius:8px;padding:16px;margin-top:20px;font-size:12px;color:#BE185D"><strong>Important :</strong> Ce dossier doit être soumis à votre OPCO (${candidatFinanceur || '—'}) avant le début de la formation. Contactez-nous pour tout besoin d'accompagnement.</div>`
      )

    case 'convocation':
      return base(`Convocation · ${formationTitre}`,
        `<div class="subtitle">Document officiel de convocation</div>` +
        section('Convoqué(e)', field('Nom', `${candidatPrenom} ${candidatNom}`) + field('Email', candidatEmail) + field('Entreprise', candidatEntreprise)) +
        section('Formation', field('Intitulé', formationTitre) + field('Référence', formationRef) + field('Formateur', formateur)) +
        section('Informations pratiques', field('Date de début', sessionDebut || 'À préciser') + field('Date de fin', sessionFin || 'À préciser') + field('Horaires', sessionHoraires) + field('Lieu', sessionLieu || 'Color Aim Studio, Bordeaux') + field('Modalité', formationModalite)) +
        section('Documents à apporter', `
          <ul style="font-size:12px;color:#374151;line-height:2;padding-left:16px">
            <li>Pièce d'identité</li>
            <li>Convention de formation signée</li>
            <li>Règlement intérieur signé</li>
          </ul>`) +
        `<div style="background:#fdf2f8;border:1px solid #fce7f3;border-radius:8px;padding:16px;margin-top:20px;font-size:12px;color:#374151">En cas d'empêchement, merci de prévenir ${organismeNom} au <strong>${organismeTel}</strong> dans les meilleurs délais.<br><br>
        <div style="display:flex;gap:48px;margin-top:16px">
          <div>Signature du stagiaire :<div style="border-bottom:1px solid #e5e7eb;width:160px;margin-top:32px"></div></div>
          <div>Cachet de l'entreprise :<div style="border-bottom:1px solid #e5e7eb;width:160px;margin-top:32px"></div></div>
        </div></div>`
      )

    case 'logistique':
      return base(`Fiche logistique · ${formationTitre}`,
        `<div class="subtitle">Informations pratiques pour le bon déroulement de la formation</div>` +
        section('Lieu & Accès', field('Adresse', sessionLieu || 'Color Aim Studio — Bordeaux') + field('Accès transports', 'Tram ligne B — arrêt Quinconces') + field('Parking', 'Parking payant à 200m') + field('Accès PMR', 'Locaux accessibles aux personnes à mobilité réduite')) +
        section('Horaires', field('Début', sessionDebut || 'À préciser') + field('Fin', sessionFin || 'À préciser') + field('Horaires journée', sessionHoraires) + field('Pauses', '10h30 et 15h30 (15 min)') + field('Déjeuner', '12h30 – 13h30')) +
        section('Équipements fournis', `
          <ul style="font-size:12px;color:#374151;line-height:2;padding-left:16px">
            <li>Ordinateur Mac avec suite Adobe (si besoin)</li>
            <li>Vidéoprojecteur et écran</li>
            <li>Supports de formation (remis en début de session)</li>
            <li>Café, thé et eau à disposition</li>
          </ul>`) +
        section('À apporter', `
          <ul style="font-size:12px;color:#374151;line-height:2;padding-left:16px">
            <li>Ordinateur portable (si travail sur vos propres fichiers)</li>
            <li>Fichiers de travail personnels (optionnel)</li>
            <li>Bloc-notes et stylo</li>
          </ul>`) +
        section("Contact en cas d'urgence", field('Référent formation', formateur) + field('Téléphone', organismeTel) + field('Email', organismeEmail))
      )

    case 'exercices':
      return base(`Exercices pratiques · ${formationTitre}`,
        `<div class="subtitle">Travaux pratiques — ${candidatPrenom} ${candidatNom}</div>` +
        section('Objectifs des exercices', `<p style="font-size:12px;line-height:1.7">${formationObjectifs || 'Mettre en pratique les notions abordées pendant la formation.'}</p>`) +
        `<div style="margin-bottom:20px">` +
        [1,2,3].map(n => `
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px">
            <div style="font-size:13px;font-weight:700;color:#BE185D;margin-bottom:8px">Exercice ${n}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:12px">Consigne : ____________________________________________</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:4px">Réponse / Production :</div>
            <div style="border:1px dashed #e5e7eb;border-radius:4px;height:80px;margin-top:4px"></div>
          </div>`).join('') +
        `</div>` +
        section('Évaluation', field('Critères', 'Précision, méthode, résultat final') + field('Auto-évaluation', '  /5') + field('Évaluation formateur', '  /5') + field('Commentaires', ''))
      )

    default:
      return base('Document', '<p>Type de document non reconnu</p>')
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, candidatId, formationId, inscriptionId } = body
    const supabase = await createClient()

    const [{ data: candidat }, { data: formation }] = await Promise.all([
      supabase.from('candidats').select('*').eq('id', candidatId).single(),
      formationId
        ? supabase.from('formations').select('*').eq('id', formationId).single()
        : Promise.resolve({ data: null }),
    ])

    let session = null
    if (inscriptionId) {
      const { data } = await supabase.from('inscriptions')
        .select('*, sessions(*)')
        .eq('id', inscriptionId).single()
      session = data?.sessions
    }

    const data: Record<string, string> = {
      candidatNom:         candidat?.nom ?? '',
      candidatPrenom:      candidat?.prenom ?? '',
      candidatEmail:       candidat?.email ?? '',
      candidatEntreprise:  candidat?.entreprise ?? '',
      candidatFinanceur:   candidat?.financeur ?? '',
      formationTitre:      formation?.titre ?? '',
      formationRef:        formation?.reference ?? '',
      formationDuree:      formation?.duree ?? formation?.duree_heures ? `${formation.duree_heures}h` : '',
      formationPrix:       String(formation?.prix ?? formation?.prix_ht ?? ''),
      formationModalite:   formation?.modalites ?? formation?.modalite ?? 'Présentiel',
      formationObjectifs:  formation?.objectifs_pedagogiques ?? '',
      formationProgramme:  formation?.programme ?? '',
      formationPublic:     formation?.public_cible ?? '',
      formationPrerequis:  formation?.prerequis ?? '',
      sessionDebut:        session?.date_debut ? new Date(session.date_debut).toLocaleDateString('fr-FR') : '',
      sessionFin:          session?.date_fin ? new Date(session.date_fin).toLocaleDateString('fr-FR') : '',
    }

    const html = buildDocHtml(type as DocType, data)
    const nomFichier = `${type}_${candidat?.nom ?? 'candidat'}_${Date.now()}.html`

    await supabase.from('documents').insert({
      candidat_id: candidatId,
      inscription_id: inscriptionId ?? null,
      formation_id: formationId ?? null,
      type,
      nom: nomFichier,
      statut: 'généré',
      genere: true,
    })

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${nomFichier}"`,
      },
    })
  } catch (err) {
    console.error('generate doc:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
