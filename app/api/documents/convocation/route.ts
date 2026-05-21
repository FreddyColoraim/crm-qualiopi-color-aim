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
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function formatHeure(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })
}

function generateReference(): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `CONV-${y}${m}-${rand}`
}

const styles = StyleSheet.create({
  page: { padding: 50, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#1a1a1a' },
  headerLeft: { flex: 1 },
  headerRight: { textAlign: 'right' },
  h1: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  grayText: { color: '#666', fontSize: 9, marginBottom: 2 },
  badge: { backgroundColor: '#1a1a1a', color: '#fff', fontSize: 8, padding: '3 8', marginBottom: 24, alignSelf: 'flex-start' },
  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 4 },
  docSubtitle: { fontSize: 9, textAlign: 'center', color: '#666', marginBottom: 32 },
  greeting: { fontSize: 11, marginBottom: 20, lineHeight: 1.6 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#666', marginBottom: 8, marginTop: 20, paddingBottom: 4, borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  infoBox: { backgroundColor: '#f8f8f8', borderWidth: 0.5, borderColor: '#e0e0e0', padding: 16, marginBottom: 16 },
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  infoLabel: { fontSize: 9, color: '#888', width: 120 },
  infoValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', flex: 1 },
  infoValueNormal: { fontSize: 10, flex: 1 },
  highlight: { backgroundColor: '#1a1a1a', color: '#fff', padding: '10 16', marginBottom: 16 },
  highlightTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#fff', marginBottom: 4 },
  highlightSub: { fontSize: 9, color: '#ccc' },
  listItem: { flexDirection: 'row', marginBottom: 6 },
  bullet: { fontSize: 10, marginRight: 8, color: '#666' },
  listText: { fontSize: 10, flex: 1, lineHeight: 1.5 },
  important: { backgroundColor: '#fff8e6', borderLeftWidth: 3, borderLeftColor: '#BA7517', padding: '10 14', marginTop: 16, marginBottom: 16 },
  importantTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#BA7517', marginBottom: 4 },
  importantText: { fontSize: 9, color: '#633806', lineHeight: 1.5 },
  signature: { marginTop: 32, paddingTop: 16, borderTopWidth: 0.5, borderTopColor: '#ddd' },
  signatureText: { fontSize: 10, marginBottom: 4 },
  signatureName: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 12 },
  signatureRole: { fontSize: 9, color: '#666' },
  footer: { position: 'absolute', bottom: 20, left: 50, right: 50, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#aaa', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
})

function ConvocationPDF({ d }: { d: any }) {
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

      React.createElement(View, { style: styles.badge },
        React.createElement(Text, null, 'ORGANISME CERTIFIÉ QUALIOPI'),
      ),

      React.createElement(Text, { style: styles.docTitle }, 'Convocation à la formation'),
      React.createElement(Text, { style: styles.docSubtitle }, `Référence session : ${d.session_reference}`),

      // Destinataire
      React.createElement(Text, { style: styles.greeting },
        `Bonjour ${d.candidat_prenom} ${d.candidat_nom},\n\nNous avons le plaisir de vous confirmer votre inscription à la formation suivante et vous adressons par ce document votre convocation officielle.`
      ),

      // Formation — bloc mis en avant
      React.createElement(View, { style: styles.highlight },
        React.createElement(Text, { style: styles.highlightTitle }, d.formation_titre),
        React.createElement(Text, { style: styles.highlightSub }, `Réf. formation : ${d.formation_reference} — Durée : ${d.duree}`),
      ),

      // Dates et lieu
      React.createElement(Text, { style: styles.sectionTitle }, 'Dates et lieu'),
      React.createElement(View, { style: styles.infoBox },
        React.createElement(View, { style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, 'Date de début'),
          React.createElement(Text, { style: styles.infoValue }, d.date_debut),
        ),
        React.createElement(View, { style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, 'Date de fin'),
          React.createElement(Text, { style: styles.infoValue }, d.date_fin),
        ),
        React.createElement(View, { style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, 'Horaires'),
          React.createElement(Text, { style: styles.infoValue }, d.horaires),
        ),
        React.createElement(View, { style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, 'Lieu'),
          React.createElement(Text, { style: styles.infoValue }, d.lieu),
        ),
        React.createElement(View, { style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, 'Formateur'),
          React.createElement(Text, { style: styles.infoValue }, d.formateur),
        ),
        React.createElement(View, { style: { ...styles.infoRow, marginBottom: 0 } },
          React.createElement(Text, { style: styles.infoLabel }, 'Modalités'),
          React.createElement(Text, { style: styles.infoValueNormal }, d.modalites),
        ),
      ),

      // Informations stagiaire
      React.createElement(Text, { style: styles.sectionTitle }, 'Vos informations'),
      React.createElement(View, { style: styles.infoBox },
        React.createElement(View, { style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, 'Nom'),
          React.createElement(Text, { style: styles.infoValue }, `${d.candidat_prenom} ${d.candidat_nom}`),
        ),
        React.createElement(View, { style: styles.infoRow },
          React.createElement(Text, { style: styles.infoLabel }, 'Entreprise'),
          React.createElement(Text, { style: styles.infoValueNormal }, d.entreprise),
        ),
        React.createElement(View, { style: { ...styles.infoRow, marginBottom: 0 } },
          React.createElement(Text, { style: styles.infoLabel }, 'Financement'),
          React.createElement(Text, { style: styles.infoValueNormal }, d.financeur),
        ),
      ),

      // À apporter
      React.createElement(Text, { style: styles.sectionTitle }, 'À prévoir pour la formation'),
      React.createElement(View, { style: { marginBottom: 4 } },
        React.createElement(View, { style: styles.listItem },
          React.createElement(Text, { style: styles.bullet }, '•'),
          React.createElement(Text, { style: styles.listText }, 'Une pièce d\'identité en cours de validité'),
        ),
        React.createElement(View, { style: styles.listItem },
          React.createElement(Text, { style: styles.bullet }, '•'),
          React.createElement(Text, { style: styles.listText }, 'Ce document de convocation (version imprimée ou numérique)'),
        ),
        React.createElement(View, { style: styles.listItem },
          React.createElement(Text, { style: styles.bullet }, '•'),
          React.createElement(Text, { style: styles.listText }, d.materiel),
        ),
      ),

      // Important
      React.createElement(View, { style: styles.important },
        React.createElement(Text, { style: styles.importantTitle }, 'IMPORTANT — Accessibilité'),
        React.createElement(Text, { style: styles.importantText }, d.accessibilite),
      ),

      // Signature
      React.createElement(View, { style: styles.signature },
        React.createElement(Text, { style: styles.signatureText }, 'Cordialement,'),
        React.createElement(Text, { style: styles.signatureName }, d.of_nom),
        React.createElement(Text, { style: styles.signatureRole }, 'L\'équipe pédagogique'),
        React.createElement(Text, { style: { ...styles.grayText, marginTop: 8 } }, `Contact : ${d.of_email} — ${d.of_telephone ?? ''}`),
      ),

      // Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, null, `${d.of_nom} — SIRET ${d.of_siret} — N° Qualiopi ${d.of_qualiopi}`),
        React.createElement(Text, null, `Convocation réf. ${d.reference}`),
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
            titre, reference, duree, modalites,
            accessibilite_handicap, delai_acces_jours,
            formateur:formateurs ( prenom, nom )
          )
        ),
        candidat:candidats (
          nom, prenom, email, poste, entreprise, financeur
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
    const reference = generateReference()

    const d = {
      of_nom:             process.env.OF_NOM ?? 'Votre Organisme de Formation',
      of_adresse:         process.env.OF_ADRESSE ?? '—',
      of_siret:           process.env.OF_SIRET ?? '—',
      of_qualiopi:        process.env.OF_QUALIOPI ?? '—',
      of_email:           process.env.OF_EMAIL ?? '—',
      of_telephone:       process.env.OF_TELEPHONE ?? '',
      reference,
      date_emission:      formatDate(new Date().toISOString()),
      session_reference:  `${formation.reference}-${formatDate(session.date_debut).replace(/ /g, '')}`,
      formation_titre:    formation.titre,
      formation_reference: formation.reference,
      duree:              formation.duree ?? '—',
      modalites:          formation.modalites ?? '—',
      date_debut:         formatDate(session.date_debut),
      date_fin:           formatDate(session.date_fin),
      horaires:           '09h00 – 17h00',
      lieu:               process.env.OF_ADRESSE ?? '—',
      formateur:          formateur ? `${formateur.prenom} ${formateur.nom}` : '—',
      candidat_nom:       candidat.nom,
      candidat_prenom:    candidat.prenom,
      entreprise:         candidat.entreprise ?? 'Non renseigné',
      financeur:          candidat.financeur ?? 'Autofinancement',
      materiel:           'Votre matériel habituel (ordinateur portable si nécessaire)',
      accessibilite:      formation.accessibilite_handicap ?? 'Locaux accessibles PMR. Pour tout besoin spécifique, contactez-nous avant le début de la formation.',
    }

    const pdfBuffer = await pdf(React.createElement(ConvocationPDF, { d })).toBuffer()

    const fileName = `convocations/${inscription_id}/${reference}.pdf`
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (storageError) console.error('Storage error:', storageError)

    const { data: signedUrl } = await supabase.storage
      .from('documents')
      .createSignedUrl(fileName, 3600)

    if (send_email) {
      const to = email_destinataire ?? candidat.email
      await sendConvocationEmail(to, candidat.prenom, formation.titre, d.date_debut, pdfBuffer, reference)
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
    console.error('Convocation generation error:', error)
    return NextResponse.json({ error: 'Erreur génération document' }, { status: 500 })
  }
}

async function sendConvocationEmail(
  to: string, prenom: string, formationTitre: string,
  dateDebut: string, pdfBuffer: Buffer, reference: string
) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: `${process.env.OF_NOM} <${process.env.OF_EMAIL ?? 'onboarding@resend.dev'}>`,
    to,
    subject: `Convocation — ${formationTitre} — ${dateDebut}`,
    html: `
      <p>Bonjour ${prenom},</p>
      <p>Veuillez trouver en pièce jointe votre convocation pour la formation <strong>${formationTitre}</strong> débutant le <strong>${dateDebut}</strong>.</p>
      <p>Merci de vous présenter muni(e) de ce document et d'une pièce d'identité.</p>
      <p>Cordialement,<br>${process.env.OF_NOM}</p>
    `,
    attachments: [{
      filename: `Convocation-${reference}.pdf`,
      content: pdfBuffer.toString('base64'),
    }],
  })
}