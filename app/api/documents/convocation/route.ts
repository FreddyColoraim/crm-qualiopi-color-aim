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
function generateReference(): string {
  const d = new Date()
  return `CONVOC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}-${Math.floor(Math.random()*9000+1000)}`
}

const S = StyleSheet.create({
  page: { padding: 50, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#1a1a1a' },
  h1: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  gray: { color: '#666', fontSize: 9, marginBottom: 2 },
  badge: { backgroundColor: '#1a1a1a', color: '#fff', fontSize: 8, padding: '3 8', marginBottom: 24, alignSelf: 'flex-start' },
  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 4 },
  docSub: { fontSize: 9, textAlign: 'center', color: '#666', marginBottom: 32 },
  greeting: { fontSize: 11, marginBottom: 20, lineHeight: 1.6 },
  secTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#666', marginBottom: 8, marginTop: 20, paddingBottom: 4, borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  highlight: { backgroundColor: '#1a1a1a', color: '#fff', padding: '10 16', marginBottom: 16 },
  highlightTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#fff', marginBottom: 4 },
  highlightSub: { fontSize: 9, color: '#ccc' },
  infoBox: { backgroundColor: '#f8f8f8', borderWidth: 0.5, borderColor: '#e0e0e0', padding: 16, marginBottom: 16 },
  infoRow: { flexDirection: 'row', marginBottom: 8 },
  infoLabel: { fontSize: 9, color: '#888', width: 120 },
  infoValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', flex: 1 },
  infoValueN: { fontSize: 10, flex: 1 },
  listItem: { flexDirection: 'row', marginBottom: 6 },
  bullet: { fontSize: 10, marginRight: 8, color: '#666' },
  listText: { fontSize: 10, flex: 1, lineHeight: 1.5 },
  important: { backgroundColor: '#fff8e6', borderLeftWidth: 3, borderLeftColor: '#BA7517', padding: '10 14', marginTop: 16, marginBottom: 16 },
  importantTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#BA7517', marginBottom: 4 },
  importantText: { fontSize: 9, color: '#633806', lineHeight: 1.5 },
  sig: { marginTop: 32, paddingTop: 16, borderTopWidth: 0.5, borderTopColor: '#ddd' },
  sigText: { fontSize: 10, marginBottom: 4 },
  sigName: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 12 },
  sigRole: { fontSize: 9, color: '#666' },
  footer: { position: 'absolute', bottom: 20, left: 50, right: 50, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#aaa', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
})

function ConvocationDoc(props: { d: any }) {
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
      React.createElement(Text, { style: S.docTitle }, 'Convocation à la formation'),
      React.createElement(Text, { style: S.docSub }, `Référence session : ${d.session_ref}`),
      React.createElement(Text, { style: S.greeting }, `Bonjour ${d.candidat_prenom} ${d.candidat_nom},\n\nNous avons le plaisir de vous confirmer votre inscription et vous adressons votre convocation officielle.`),
      React.createElement(View, { style: S.highlight },
        React.createElement(Text, { style: S.highlightTitle }, d.formation_titre),
        React.createElement(Text, { style: S.highlightSub }, `Réf. ${d.formation_reference} — Durée : ${d.duree}`),
      ),
      React.createElement(Text, { style: S.secTitle }, 'Dates et lieu'),
      React.createElement(View, { style: S.infoBox },
        React.createElement(View, { style: S.infoRow },
          React.createElement(Text, { style: S.infoLabel }, 'Date de début'),
          React.createElement(Text, { style: S.infoValue }, d.date_debut),
        ),
        React.createElement(View, { style: S.infoRow },
          React.createElement(Text, { style: S.infoLabel }, 'Date de fin'),
          React.createElement(Text, { style: S.infoValue }, d.date_fin),
        ),
        React.createElement(View, { style: S.infoRow },
          React.createElement(Text, { style: S.infoLabel }, 'Horaires'),
          React.createElement(Text, { style: S.infoValue }, '09h00 – 17h00'),
        ),
        React.createElement(View, { style: S.infoRow },
          React.createElement(Text, { style: S.infoLabel }, 'Lieu'),
          React.createElement(Text, { style: S.infoValue }, d.lieu),
        ),
        React.createElement(View, { style: { ...S.infoRow, marginBottom: 0 } },
          React.createElement(Text, { style: S.infoLabel }, 'Formateur'),
          React.createElement(Text, { style: S.infoValue }, d.formateur),
        ),
      ),
      React.createElement(Text, { style: S.secTitle }, 'Vos informations'),
      React.createElement(View, { style: S.infoBox },
        React.createElement(View, { style: S.infoRow },
          React.createElement(Text, { style: S.infoLabel }, 'Nom'),
          React.createElement(Text, { style: S.infoValue }, `${d.candidat_prenom} ${d.candidat_nom}`),
        ),
        React.createElement(View, { style: { ...S.infoRow, marginBottom: 0 } },
          React.createElement(Text, { style: S.infoLabel }, 'Financement'),
          React.createElement(Text, { style: S.infoValueN }, d.financeur),
        ),
      ),
      React.createElement(Text, { style: S.secTitle }, 'À prévoir'),
      React.createElement(View, { style: S.listItem },
        React.createElement(Text, { style: S.bullet }, '•'),
        React.createElement(Text, { style: S.listText }, "Une pièce d'identité en cours de validité"),
      ),
      React.createElement(View, { style: S.listItem },
        React.createElement(Text, { style: S.bullet }, '•'),
        React.createElement(Text, { style: S.listText }, 'Ce document de convocation'),
      ),
      React.createElement(View, { style: S.listItem },
        React.createElement(Text, { style: S.bullet }, '•'),
        React.createElement(Text, { style: S.listText }, 'Votre matériel habituel'),
      ),
      React.createElement(View, { style: S.important },
        React.createElement(Text, { style: S.importantTitle }, 'ACCESSIBILITÉ'),
        React.createElement(Text, { style: S.importantText }, d.accessibilite),
      ),
      React.createElement(View, { style: S.sig },
        React.createElement(Text, { style: S.sigText }, 'Cordialement,'),
        React.createElement(Text, { style: S.sigName }, d.of_nom),
        React.createElement(Text, { style: S.sigRole }, "L'équipe pédagogique"),
        React.createElement(Text, { style: { ...S.gray, marginTop: 8 } }, `Contact : ${d.of_email}`),
      ),
      React.createElement(View, { style: S.footer },
        React.createElement(Text, null, `${d.of_nom} — SIRET ${d.of_siret}`),
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
            accessibilite_handicap,
            formateur:formateurs ( prenom, nom )
          )
        ),
        candidat:candidats ( nom, prenom, email, poste, entreprise, financeur )
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
      of_nom:           process.env.OF_NOM ?? 'Votre Organisme de Formation',
      of_adresse:       process.env.OF_ADRESSE ?? '—',
      of_siret:         process.env.OF_SIRET ?? '—',
      of_qualiopi:      process.env.OF_QUALIOPI ?? '—',
      of_email:         process.env.OF_EMAIL ?? '—',
      reference,
      date_emission:    formatDate(new Date().toISOString()),
      session_ref:      `${formation.reference}-${session.date_debut}`,
      formation_titre:  formation.titre,
      formation_reference: formation.reference,
      duree:            formation.duree ?? '—',
      date_debut:       formatDate(session.date_debut),
      date_fin:         formatDate(session.date_fin),
      lieu:             process.env.OF_ADRESSE ?? '—',
      formateur:        formateur ? `${formateur.prenom} ${formateur.nom}` : '—',
      candidat_nom:     candidat.nom,
      candidat_prenom:  candidat.prenom,
      financeur:        candidat.financeur ?? 'Autofinancement',
      accessibilite:    formation.accessibilite_handicap ?? 'Locaux accessibles PMR.',
    }

    const pdfDoc = pdf(React.createElement(ConvocationDoc, { d }) as any)
    const pdfBuffer = Buffer.from(await pdfDoc.toBuffer() as unknown as ArrayBuffer)

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
      await sendEmail(to, candidat.prenom, formation.titre, d.date_debut, pdfBuffer, reference)
    }

    return NextResponse.json({ success: true, reference, url: signedUrl?.signedUrl ?? null, email_sent: send_email })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    console.error('Convocation generation error:', error)
    return NextResponse.json({ error: 'Erreur génération document' }, { status: 500 })
  }
}

async function sendEmail(to: string, prenom: string, titre: string, dateDebut: string, pdfBuffer: Buffer, reference: string) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: `${process.env.OF_NOM} <${process.env.OF_EMAIL ?? 'onboarding@resend.dev'}>`,
    to,
    subject: `Convocation — ${titre} — ${dateDebut}`,
    html: `<p>Bonjour ${prenom},</p><p>Veuillez trouver en pièce jointe votre convocation pour <strong>${titre}</strong>.</p><p>Cordialement,<br>${process.env.OF_NOM}</p>`,
    attachments: [{ filename: `Convocation-${reference}.pdf`, content: pdfBuffer.toString('base64') }],
  })
}