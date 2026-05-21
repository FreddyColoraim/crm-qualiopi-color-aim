import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer'

const schema = z.object({
  inscription_id: z.string().uuid(),
  send_email: z.boolean().optional().default(false),
  email_destinataire: z.string().email().optional(),
})

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatMontant(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
}

function generateReference(): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `CONV-${y}${m}-${rand}`
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#1a1a1a' },
  headerLeft: { flex: 1 },
  headerRight: { textAlign: 'right' },
  h1: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  h2: { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 9, textAlign: 'center', color: '#666', marginBottom: 20 },
  badge: { backgroundColor: '#1a1a1a', color: '#fff', fontSize: 8, padding: '3 8', marginBottom: 16, alignSelf: 'flex-start' },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#666', marginBottom: 8, marginTop: 16, paddingBottom: 3, borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  row2: { flexDirection: 'row', gap: 16, marginBottom: 6 },
  col: { flex: 1 },
  label: { fontSize: 8, color: '#888', marginBottom: 2 },
  value: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  valueNormal: { fontSize: 10 },
  table: { marginTop: 6 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0f0f0', padding: '5 8' },
  tableRow: { flexDirection: 'row', padding: '5 8', borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  tableRowTotal: { flexDirection: 'row', padding: '5 8', backgroundColor: '#f8f8f8' },
  th: { fontSize: 8, color: '#666', fontFamily: 'Helvetica-Bold', flex: 1 },
  td: { fontSize: 9, flex: 1 },
  tdRight: { fontSize: 9, flex: 1, textAlign: 'right' },
  thRight: { fontSize: 8, color: '#666', fontFamily: 'Helvetica-Bold', flex: 1, textAlign: 'right' },
  conditionsText: { fontSize: 9, color: '#555', lineHeight: 1.5, marginBottom: 4 },
  signaturesRow: { flexDirection: 'row', gap: 32, marginTop: 24, paddingTop: 16, borderTopWidth: 0.5, borderTopColor: '#ddd' },
  signatureBlock: { flex: 1 },
  signatureLabel: { fontSize: 8, color: '#888', marginBottom: 3 },
  signatureName: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  signatureRole: { fontSize: 9, color: '#666', marginBottom: 28 },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: '#1a1a1a', marginBottom: 3 },
  signatureDateLabel: { fontSize: 8, color: '#888' },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#aaa', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
  grayText: { color: '#666', fontSize: 9 },
  boxed: { backgroundColor: '#f8f8f8', padding: 10, marginTop: 4, fontSize: 9, lineHeight: 1.5 },
})

function ConventionPDF({ d }: { d: any }) {
  return React.createElement(Document, null,
    React.createElement(Page, { size: 'A4', style: styles.page },

      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(View, { style: styles.headerLeft },
          React.createElement(Text, { style: styles.h1 }, d.of_nom),
          React.createElement(Text, { style: styles.grayText }, d.of_adresse),
          React.createElement(Text, { style: styles.grayText }, `SIRET : ${d.of_siret} — N° Qualiopi : ${d.of_qualiopi}`),
        ),
        React.createElement(View, { style: styles.headerRight },
          React.createElement(Text, { style: { fontSize: 10, fontFamily: 'Helvetica-Bold' } }, `Réf : ${d.reference}`),
          React.createElement(Text, { style: styles.grayText }, `Émise le ${d.date_emission}`),
        ),
      ),

      // Badge + titre
      React.createElement(View, { style: styles.badge }, React.createElement(Text, null, 'ORGANISME CERTIFIÉ QUALIOPI')),
      React.createElement(Text, { style: styles.h2 }, 'Convention de Formation Professionnelle'),
      React.createElement(Text, { style: styles.subtitle }, 'Établie conformément aux articles L.6353-1 et suivants du Code du travail'),

      // Parties
      React.createElement(Text, { style: styles.sectionTitle }, 'Parties à la convention'),
      React.createElement(View, { style: styles.row2 },
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Organisme de formation'),
          React.createElement(Text, { style: styles.value }, d.of_nom),
          React.createElement(Text, { style: styles.grayText }, d.of_adresse),
          React.createElement(Text, { style: styles.grayText }, `SIRET : ${d.of_siret}`),
        ),
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Entreprise cliente'),
          React.createElement(Text, { style: styles.value }, d.entreprise_nom),
          React.createElement(Text, { style: styles.grayText }, `Représentée par : ${d.entreprise_contact}`),
        ),
      ),

      // Formation
      React.createElement(Text, { style: styles.sectionTitle }, 'Objet de la formation'),
      React.createElement(View, { style: styles.row2 },
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Intitulé'),
          React.createElement(Text, { style: styles.value }, d.formation_titre),
        ),
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Référence'),
          React.createElement(Text, { style: styles.valueNormal }, d.formation_reference),
        ),
      ),
      React.createElement(View, { style: styles.row2 },
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Public visé'),
          React.createElement(Text, { style: styles.valueNormal }, d.public_cible),
        ),
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Prérequis'),
          React.createElement(Text, { style: styles.valueNormal }, d.prerequis),
        ),
      ),

      // Objectifs
      React.createElement(Text, { style: styles.sectionTitle }, 'Objectifs pédagogiques'),
      React.createElement(View, { style: styles.boxed },
        React.createElement(Text, null, d.objectifs),
      ),

      // Session
      React.createElement(Text, { style: styles.sectionTitle }, 'Modalités de la session'),
      React.createElement(View, { style: styles.row2 },
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Date de début'),
          React.createElement(Text, { style: styles.valueNormal }, d.date_debut),
        ),
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Date de fin'),
          React.createElement(Text, { style: styles.valueNormal }, d.date_fin),
        ),
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Durée'),
          React.createElement(Text, { style: styles.valueNormal }, d.duree),
        ),
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Formateur'),
          React.createElement(Text, { style: styles.valueNormal }, d.formateur),
        ),
      ),
      React.createElement(View, { style: styles.row2 },
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Lieu'),
          React.createElement(Text, { style: styles.valueNormal }, d.lieu),
        ),
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Modalités'),
          React.createElement(Text, { style: styles.valueNormal }, d.modalites),
        ),
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Effectif max'),
          React.createElement(Text, { style: styles.valueNormal }, `${d.places_max} stagiaires`),
        ),
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Accessibilité'),
          React.createElement(Text, { style: styles.valueNormal }, d.accessibilite),
        ),
      ),

      // Stagiaire
      React.createElement(Text, { style: styles.sectionTitle }, 'Stagiaire'),
      React.createElement(View, { style: styles.table },
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: styles.th }, 'Nom Prénom'),
          React.createElement(Text, { style: styles.th }, 'Poste'),
          React.createElement(Text, { style: styles.th }, 'Email'),
          React.createElement(Text, { style: styles.th }, 'Financement'),
        ),
        React.createElement(View, { style: styles.tableRow },
          React.createElement(Text, { style: styles.td }, `${d.candidat_prenom} ${d.candidat_nom}`),
          React.createElement(Text, { style: styles.td }, d.candidat_poste),
          React.createElement(Text, { style: styles.td }, d.candidat_email),
          React.createElement(Text, { style: styles.td }, d.financeur),
        ),
      ),

      // Financier
      React.createElement(Text, { style: styles.sectionTitle }, 'Conditions financières'),
      React.createElement(View, { style: styles.table },
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: { ...styles.th, flex: 2 } }, 'Désignation'),
          React.createElement(Text, { style: styles.thRight }, 'HT'),
          React.createElement(Text, { style: styles.thRight }, 'TVA'),
          React.createElement(Text, { style: styles.thRight }, 'TTC'),
        ),
        React.createElement(View, { style: styles.tableRow },
          React.createElement(Text, { style: { ...styles.td, flex: 2 } }, d.formation_titre),
          React.createElement(Text, { style: styles.tdRight }, `${d.prix_ht} €`),
          React.createElement(Text, { style: styles.tdRight }, `${d.prix_tva} €`),
          React.createElement(Text, { style: styles.tdRight }, `${d.prix_ttc} €`),
        ),
        React.createElement(View, { style: styles.tableRowTotal },
          React.createElement(Text, { style: { ...styles.td, flex: 2, fontFamily: 'Helvetica-Bold' } }, 'Total'),
          React.createElement(Text, { style: { ...styles.tdRight, fontFamily: 'Helvetica-Bold' } }, `${d.prix_ht} €`),
          React.createElement(Text, { style: { ...styles.tdRight, fontFamily: 'Helvetica-Bold' } }, `${d.prix_tva} €`),
          React.createElement(Text, { style: { ...styles.tdRight, fontFamily: 'Helvetica-Bold' } }, `${d.prix_ttc} €`),
        ),
      ),

      // Conditions
      React.createElement(Text, { style: styles.sectionTitle }, 'Conditions générales'),
      React.createElement(Text, { style: styles.conditionsText }, `Annulation : Toute annulation doit être notifiée par écrit. En cas d'annulation moins de 7 jours ouvrés avant le début de la formation, 30% du montant total sera facturé.`),
      React.createElement(Text, { style: styles.conditionsText }, `Délai d'accès : L'inscription est possible jusqu'à ${d.delai_acces} jours ouvrés avant le début de la session.`),
      React.createElement(Text, { style: styles.conditionsText }, `Évaluation : ${d.moyens_evaluation}`),

      // Signatures
      React.createElement(View, { style: styles.signaturesRow },
        React.createElement(View, { style: styles.signatureBlock },
          React.createElement(Text, { style: styles.signatureLabel }, "Pour l'organisme de formation"),
          React.createElement(Text, { style: styles.signatureName }, d.of_nom),
          React.createElement(Text, { style: styles.signatureRole }, 'Le responsable pédagogique'),
          React.createElement(View, { style: styles.signatureLine }),
          React.createElement(Text, { style: styles.signatureDateLabel }, 'Signature et cachet — Date : _______________'),
        ),
        React.createElement(View, { style: styles.signatureBlock },
          React.createElement(Text, { style: styles.signatureLabel }, "Pour l'entreprise cliente"),
          React.createElement(Text, { style: styles.signatureName }, d.entreprise_nom),
          React.createElement(Text, { style: styles.signatureRole }, d.entreprise_contact),
          React.createElement(View, { style: styles.signatureLine }),
          React.createElement(Text, { style: styles.signatureDateLabel }, 'Signature et cachet — Date : _______________'),
        ),
      ),

      // Footer
      React.createElement(View, { style: styles.footer },
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
      of_nom:             process.env.OF_NOM ?? 'Votre Organisme de Formation',
      of_adresse:         process.env.OF_ADRESSE ?? '—',
      of_siret:           process.env.OF_SIRET ?? '—',
      of_qualiopi:        process.env.OF_QUALIOPI ?? '—',
      reference,
      date_emission:      formatDate(new Date().toISOString()),
      entreprise_nom:     candidat.entreprise ?? `${candidat.prenom} ${candidat.nom}`,
      entreprise_contact: `${candidat.prenom} ${candidat.nom}`,
      formation_titre:    formation.titre,
      formation_reference: formation.reference,
      public_cible:       formation.public_cible ?? '—',
      prerequis:          formation.prerequis ?? 'Aucun',
      objectifs:          formation.objectifs_pedagogiques ?? '—',
      duree:              formation.duree ?? '—',
      modalites:          formation.modalites ?? '—',
      lieu:               process.env.OF_ADRESSE ?? '—',
      formateur:          formateur ? `${formateur.prenom} ${formateur.nom}` : '—',
      places_max:         String(session.places_max),
      accessibilite:      formation.accessibilite_handicap ?? 'Locaux accessibles PMR.',
      delai_acces:        String(formation.delai_acces_jours ?? 15),
      moyens_evaluation:  formation.moyens_evaluation ?? '—',
      date_debut:         formatDate(session.date_debut),
      date_fin:           formatDate(session.date_fin),
      candidat_nom:       candidat.nom,
      candidat_prenom:    candidat.prenom,
      candidat_email:     candidat.email,
      candidat_poste:     candidat.poste ?? '—',
      financeur:          candidat.financeur ?? 'Autofinancement',
      prix_ht:            formatMontant(prixHT),
      prix_tva:           formatMontant(prixTVA),
      prix_ttc:           formatMontant(prixTTC),
    }

    const pdfBuffer = await pdf(React.createElement(ConventionPDF, { d })).toBuffer()

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
      await sendConventionEmail(to, candidat.prenom, formation.titre, pdfBuffer, reference)
    }

    return NextResponse.json({
      success: true,
      reference,
      url: signedUrl?.signedUrl ?? null,
      email_sent: send_email,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: error.errors }, { status: 400 })
    }
    console.error('Convention generation error:', error)
    return NextResponse.json({ error: 'Erreur génération document' }, { status: 500 })
  }
}

async function sendConventionEmail(
  to: string, prenom: string, formationTitre: string,
  pdfBuffer: Buffer, reference: string
) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  await resend.emails.send({
    from: `${process.env.OF_NOM} <${process.env.OF_EMAIL ?? 'onboarding@resend.dev'}>`,
    to,
    subject: `Convention de formation — ${formationTitre} (${reference})`,
    html: `<p>Bonjour ${prenom},</p><p>Veuillez trouver en pièce jointe votre convention pour <strong>${formationTitre}</strong>.</p><p>Cordialement,<br>${process.env.OF_NOM}</p>`,
   attachments: [{
  filename: `Convention-${reference}.pdf`,
  content: pdfBuffer.toString('base64'),
}],
  })
}