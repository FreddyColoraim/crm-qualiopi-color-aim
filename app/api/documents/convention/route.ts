import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

const schema = z.object({
  inscription_id: z.string().uuid(),
  send_email: z.boolean().optional().default(false),
  email_destinataire: z.string().email().optional(),
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}
function formatMontant(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
}
function generateReference(): string {
  const d = new Date()
  return `CONV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${Math.floor(Math.random()*9000+1000)}`
}

const S = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#1a1a1a' },
  h1: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  gray: { color: '#666', fontSize: 9, marginBottom: 2 },
  badge: { backgroundColor: '#1a1a1a', color: '#fff', fontSize: 8, padding: '3 8', marginBottom: 16, alignSelf: 'flex-start' },
  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 4 },
  docSub: { fontSize: 9, textAlign: 'center', color: '#666', marginBottom: 20 },
  secTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#666', marginBottom: 8, marginTop: 16, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  row2: { flexDirection: 'row', gap: 16, marginBottom: 6 },
  col: { flex: 1 },
  lbl: { fontSize: 8, color: '#888', marginBottom: 2 },
  val: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  valN: { fontSize: 10 },
  box: { backgroundColor: '#f8f8f8', padding: 10, marginTop: 4, fontSize: 9, lineHeight: 1.5 },
  tHead: { flexDirection: 'row', backgroundColor: '#f0f0f0', padding: '5 8' },
  tRow: { flexDirection: 'row', padding: '5 8', borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  tRowTotal: { flexDirection: 'row', padding: '5 8', backgroundColor: '#f8f8f8' },
  th: { fontSize: 8, color: '#666', fontFamily: 'Helvetica-Bold', flex: 1 },
  thR: { fontSize: 8, color: '#666', fontFamily: 'Helvetica-Bold', flex: 1, textAlign: 'right' },
  td: { fontSize: 9, flex: 1 },
  tdR: { fontSize: 9, flex: 1, textAlign: 'right' },
  cond: { fontSize: 9, color: '#555', lineHeight: 1.5, marginBottom: 4 },
  sigs: { flexDirection: 'row', gap: 32, marginTop: 24, paddingTop: 16, borderTopWidth: 0.5, borderTopColor: '#ddd' },
  sig: { flex: 1 },
  sigLbl: { fontSize: 8, color: '#888', marginBottom: 3 },
  sigName: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  sigRole: { fontSize: 9, color: '#666', marginBottom: 28 },
  sigLine: { borderBottomWidth: 1, borderBottomColor: '#1a1a1a', marginBottom: 3 },
  sigDate: { fontSize: 8, color: '#888' },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#aaa', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
})

function ConventionDoc(props: { d: any }) {
  const { d } = props
  return React.createElement(Document, null,
    React.createElement(Page, { size: 'A4', style: S.page },
      React.createElement(View, { style: S.header },
        React.createElement(View, { style: { flex: 1 } },
          React.createElement(Text, { style: S.h1 }, d.of_nom),
          React.createElement(Text, { style: S.gray }, d.of_adresse),
          React.createElement(Text, { style: S.gray }, `SIRET : ${d.of_siret} — N° Qualiopi : ${d.of_qualiopi}`),
        ),
        React.createElement(View, { style: { textAlign: 'right' } },
          React.createElement(Text, { style: { fontSize: 10, fontFamily: 'Helvetica-Bold' } }, `Réf : ${d.reference}`),
          React.createElement(Text, { style: S.gray }, `Émise le ${d.date_emission}`),
        ),
      ),
      React.createElement(View, { style: S.badge }, React.createElement(Text, null, 'ORGANISME CERTIFIÉ QUALIOPI')),
      React.createElement(Text, { style: S.docTitle }, 'Convention de Formation Professionnelle'),
      React.createElement(Text, { style: S.docSub }, 'Établie conformément aux articles L.6353-1 et suivants du Code du travail'),

      React.createElement(Text, { style: S.secTitle }, 'Parties à la convention'),
      React.createElement(View, { style: S.row2 },
        React.createElement(View, { style: S.col },
          React.createElement(Text, { style: S.lbl }, 'Organisme de formation'),
          React.createElement(Text, { style: S.val }, d.of_nom),
          React.createElement(Text, { style: S.gray }, d.of_adresse),
          React.createElement(Text, { style: S.gray }, `SIRET : ${d.of_siret}`),
        ),
        React.createElement(View, { style: S.col },
          React.createElement(Text, { style: S.lbl }, 'Entreprise cliente'),
          React.createElement(Text, { style: S.val }, d.entreprise_nom),
          React.createElement(Text, { style: S.gray }, `Représentée par : ${d.entreprise_contact}`),
        ),
      ),

      React.createElement(Text, { style: S.secTitle }, 'Objet de la formation'),
      React.createElement(View, { style: S.row2 },
        React.createElement(View, { style: S.col },
          React.createElement(Text, { style: S.lbl }, 'Intitulé'),
          React.createElement(Text, { style: S.val }, d.formation_titre),
        ),
        React.createElement(View, { style: S.col },
          React.createElement(Text, { style: S.lbl }, 'Référence'),
          React.createElement(Text, { style: S.valN }, d.formation_reference),
        ),
      ),
      React.createElement(View, { style: S.row2 },
        React.createElement(View, { style: S.col },
          React.createElement(Text, { style: S.lbl }, 'Public visé'),
          React.createElement(Text, { style: S.valN }, d.public_cible),
        ),
        React.createElement(View, { style: S.col },
          React.createElement(Text, { style: S.lbl }, 'Prérequis'),
          React.createElement(Text, { style: S.valN }, d.prerequis),
        ),
      ),

      React.createElement(Text, { style: S.secTitle }, 'Objectifs pédagogiques'),
      React.createElement(View, { style: S.box }, React.createElement(Text, null, d.objectifs)),

      React.createElement(Text, { style: S.secTitle }, 'Modalités de la session'),
      React.createElement(View, { style: S.row2 },
        React.createElement(View, { style: S.col },
          React.createElement(Text, { style: S.lbl }, 'Date de début'),
          React.createElement(Text, { style: S.valN }, d.date_debut),
        ),
        React.createElement(View, { style: S.col },
          React.createElement(Text, { style: S.lbl }, 'Date de fin'),
          React.createElement(Text, { style: S.valN }, d.date_fin),
        ),
        React.createElement(View, { style: S.col },
          React.createElement(Text, { style: S.lbl }, 'Durée'),
          React.createElement(Text, { style: S.valN }, d.duree),
        ),
        React.createElement(View, { style: S.col },
          React.createElement(Text, { style: S.lbl }, 'Formateur'),
          React.createElement(Text, { style: S.valN }, d.formateur),
        ),
      ),
      React.createElement(View, { style: S.row2 },
        React.createElement(View, { style: S.col },
          React.createElement(Text, { style: S.lbl }, 'Lieu'),
          React.createElement(Text, { style: S.valN }, d.lieu),
        ),
        React.createElement(View, { style: S.col },
          React.createElement(Text, { style: S.lbl }, 'Modalités'),
          React.createElement(Text, { style: S.valN }, d.modalites),
        ),
        React.createElement(View, { style: S.col },
          React.createElement(Text, { style: S.lbl }, 'Effectif max'),
          React.createElement(Text, { style: S.valN }, `${d.places_max} stagiaires`),
        ),
      ),

      React.createElement(Text, { style: S.secTitle }, 'Stagiaire'),
      React.createElement(View, { style: S.tHead },
        React.createElement(Text, { style: S.th }, 'Nom Prénom'),
        React.createElement(Text, { style: S.th }, 'Poste'),
        React.createElement(Text, { style: S.th }, 'Email'),
        React.createElement(Text, { style: S.th }, 'Financement'),
      ),
      React.createElement(View, { style: S.tRow },
        React.createElement(Text, { style: S.td }, `${d.candidat_prenom} ${d.candidat_nom}`),
        React.createElement(Text, { style: S.td }, d.candidat_poste),
        React.createElement(Text, { style: S.td }, d.candidat_email),
        React.createElement(Text, { style: S.td }, d.financeur),
      ),

      React.createElement(Text, { style: S.secTitle }, 'Conditions financières'),
      React.createElement(View, { style: S.tHead },
        React.createElement(Text, { style: { ...S.th, flex: 2 } }, 'Désignation'),
        React.createElement(Text, { style: S.thR }, 'HT'),
        React.createElement(Text, { style: S.thR }, 'TVA'),
        React.createElement(Text, { style: S.thR }, 'TTC'),
      ),
      React.createElement(View, { style: S.tRow },
        React.createElement(Text, { style: { ...S.td, flex: 2 } }, d.formation_titre),
        React.createElement(Text, { style: S.tdR }, `${d.prix_ht} €`),
        React.createElement(Text, { style: S.tdR }, `${d.prix_tva} €`),
        React.createElement(Text, { style: S.tdR }, `${d.prix_ttc} €`),
      ),
      React.createElement(View, { style: S.tRowTotal },
        React.createElement(Text, { style: { ...S.td, flex: 2, fontFamily: 'Helvetica-Bold' } }, 'Total'),
        React.createElement(Text, { style: { ...S.tdR, fontFamily: 'Helvetica-Bold' } }, `${d.prix_ht} €`),
        React.createElement(Text, { style: { ...S.tdR, fontFamily: 'Helvetica-Bold' } }, `${d.prix_tva} €`),
        React.createElement(Text, { style: { ...S.tdR, fontFamily: 'Helvetica-Bold' } }, `${d.prix_ttc} €`),
      ),

      React.createElement(Text, { style: S.secTitle }, 'Conditions générales'),
      React.createElement(Text, { style: S.cond }, `Annulation : Toute annulation doit être notifiée par écrit. En cas d'annulation moins de 7 jours ouvrés avant le début de la formation, 30% du montant total sera facturé.`),
      React.createElement(Text, { style: S.cond }, `Délai d'accès : L'inscription est possible jusqu'à ${d.delai_acces} jours ouvrés avant le début de la session.`),
      React.createElement(Text, { style: S.cond }, `Évaluation : ${d.moyens_evaluation}`),
      React.createElement(Text, { style: S.cond }, `Accessibilité : ${d.accessibilite}`),

      React.createElement(View, { style: S.sigs },
        React.createElement(View, { style: S.sig },
          React.createElement(Text, { style: S.sigLbl }, "Pour l'organisme de formation"),
          React.createElement(Text, { style: S.sigName }, d.of_nom),
          React.createElement(Text, { style: S.sigRole }, 'Le responsable pédagogique'),
          React.createElement(View, { style: S.sigLine }),
          React.createElement(Text, { style: S.sigDate }, 'Signature et cachet — Date : _______________'),
        ),
        React.createElement(View, { style: S.sig },
          React.createElement(Text, { style: S.sigLbl }, "Pour l'entreprise cliente"),
          React.createElement(Text, { style: S.sigName }, d.entreprise_nom),
          React.createElement(Text, { style: S.sigRole }, d.entreprise_contact),
          React.createElement(View, { style: S.sigLine }),
          React.createElement(Text, { style: S.sigDate }, 'Signature et cachet — Date : _______________'),
        ),
      ),

      React.createElement(View, { style: S.footer },
        React.createElement(Text, null, `${d.of_nom} — SIRET ${d.of_siret} — N° Qualiopi ${d.of_qualiopi}`),
        React.createElement(Text, null, `Convention réf. ${d.reference}`),
      ),
    )
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inscription_id, send_email, email_destinataire } = schema.parse(body)

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: inscription, error: dbError } = await supabase
      .from('inscriptions')
      .select(`
        id,
        session:sessions (
          id, date_debut, date_fin, places_max,
          formation:formations (
            titre, reference, duree, modalites, public_cible,
            prerequis, objectifs_pedagogiques, methodes_pedagogiques,
            moyens_evaluation, accessibilite_handicap, delai_acces_jours,
            prix, prix_ttc, type,
            formateur:formateurs ( prenom, nom )
          )
        ),
        candidat:candidats (
          nom, prenom, email, poste, entreprise, financeur, numero_dossier
        )
      `)
      .eq('id', inscription_id)
      .single()

    if (dbError || !inscription) {
      return NextResponse.json({ error: 'Inscription introuvable' }, { status: 404 })
    }

    const { session, candidat } = inscription as any
    const { formation } = session
    const formateur = formation.formateur

    const prixHT = Number(formation.prix ?? 0)
    const prixTTC = Number(formation.prix_ttc ?? prixHT * 1.2)
    const prixTVA = prixTTC - prixHT
    const reference = generateReference()

    const d = {
      of_nom:               process.env.OF_NOM ?? 'Votre Organisme de Formation',
      of_adresse:           process.env.OF_ADRESSE ?? '—',
      of_siret:             process.env.OF_SIRET ?? '—',
      of_qualiopi:          process.env.OF_QUALIOPI ?? '—',
      reference,
      date_emission:        formatDate(new Date().toISOString()),
      entreprise_nom:       candidat.entreprise ?? `${candidat.prenom} ${candidat.nom}`,
      entreprise_contact:   `${candidat.prenom} ${candidat.nom}`,
      formation_titre:      formation.titre,
      formation_reference:  formation.reference,
      public_cible:         formation.public_cible ?? '—',
      prerequis:            formation.prerequis ?? 'Aucun',
      objectifs:            formation.objectifs_pedagogiques ?? '—',
      duree:                formation.duree ?? '—',
      modalites:            formation.modalites ?? '—',
      lieu:                 process.env.OF_ADRESSE ?? '—',
      formateur:            formateur ? `${formateur.prenom} ${formateur.nom}` : '—',
      places_max:           String(session.places_max),
      accessibilite:        formation.accessibilite_handicap ?? 'Locaux accessibles PMR.',
      delai_acces:          String(formation.delai_acces_jours ?? 15),
      moyens_evaluation:    formation.moyens_evaluation ?? '—',
      date_debut:           formatDate(session.date_debut),
      date_fin:             formatDate(session.date_fin),
      candidat_nom:         candidat.nom,
      candidat_prenom:      candidat.prenom,
      candidat_email:       candidat.email,
      candidat_poste:       candidat.poste ?? '—',
      financeur:            candidat.financeur ?? 'Autofinancement',
      prix_ht:              formatMontant(prixHT),
      prix_tva:             formatMontant(prixTVA),
      prix_ttc:             formatMontant(prixTTC),
    }

    const pdfDoc = pdf(React.createElement(ConventionDoc, { d }) as any)
    const pdfBuffer = Buffer.from(await pdfDoc.toBuffer() as unknown as ArrayBuffer)

    const fileName = `conventions/${inscription_id}/${reference}.pdf`
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (storageError) console.error('Storage error:', storageError)

    const { data: signedUrl } = await supabase.storage
      .from('documents')
      .createSignedUrl(fileName, 3600)

    if (send_email) {
      const to = email_destinataire ?? candidat.email
      await sendEmail(to, candidat.prenom, formation.titre, pdfBuffer, reference)
    }

    return NextResponse.json({ success: true, reference, url: signedUrl?.signedUrl ?? null, email_sent: send_email })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    console.error('Convention generation error:', error)
    return NextResponse.json({ error: 'Erreur génération document' }, { status: 500 })
  }
}

async function sendEmail(to: string, prenom: string, formationTitre: string, pdfBuffer: Buffer, reference: string) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: `${process.env.OF_NOM} <${process.env.OF_EMAIL ?? 'onboarding@resend.dev'}>`,
    to,
    subject: `Convention de formation — ${formationTitre} (${reference})`,
    html: `<p>Bonjour ${prenom},</p><p>Veuillez trouver en pièce jointe votre convention pour <strong>${formationTitre}</strong>.</p><p>Cordialement,<br>${process.env.OF_NOM}</p>`,
    attachments: [{ filename: `Convention-${reference}.pdf`, content: pdfBuffer.toString('base64') }],
  })
}