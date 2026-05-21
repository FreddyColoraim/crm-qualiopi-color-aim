import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

const schema = z.object({
  formation_id: z.string().uuid(),
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
  return `DEVIS-${y}${m}-${rand}`
}

// Date de validité = aujourd'hui + 30 jours
function dateValidite(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return formatDate(d.toISOString())
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
  docRef: { fontSize: 9, textAlign: 'center', color: '#666', marginBottom: 8 },
  validite: { fontSize: 9, textAlign: 'center', color: '#BA7517', marginBottom: 28, fontFamily: 'Helvetica-Bold' },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#666', marginBottom: 8, marginTop: 20, paddingBottom: 4, borderBottomWidth: 0.5, borderBottomColor: '#ddd' },
  row2: { flexDirection: 'row', gap: 16, marginBottom: 6 },
  col: { flex: 1 },
  label: { fontSize: 8, color: '#888', marginBottom: 2 },
  value: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  valueNormal: { fontSize: 10 },
  boxed: { backgroundColor: '#f8f8f8', borderWidth: 0.5, borderColor: '#e0e0e0', padding: 12, marginTop: 4, fontSize: 9, lineHeight: 1.6 },
  // Tableau financier
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1a1a1a', padding: '7 10' },
  tableRow: { flexDirection: 'row', padding: '7 10', borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  tableRowAlt: { flexDirection: 'row', padding: '7 10', backgroundColor: '#f8f8f8', borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  tableRowTotal: { flexDirection: 'row', padding: '10 10', backgroundColor: '#1a1a1a' },
  th: { fontSize: 9, color: '#fff', fontFamily: 'Helvetica-Bold', flex: 1 },
  thRight: { fontSize: 9, color: '#fff', fontFamily: 'Helvetica-Bold', flex: 1, textAlign: 'right' },
  td: { fontSize: 9, flex: 1, color: '#1a1a1a' },
  tdRight: { fontSize: 9, flex: 1, textAlign: 'right', color: '#1a1a1a' },
  tdTotal: { fontSize: 10, flex: 1, color: '#fff', fontFamily: 'Helvetica-Bold' },
  tdTotalRight: { fontSize: 10, flex: 1, textAlign: 'right', color: '#fff', fontFamily: 'Helvetica-Bold' },
  // TVA note
  tvaNote: { fontSize: 8, color: '#888', marginTop: 6, fontStyle: 'italic' },
  // Financement OPCO
  opcoBox: { backgroundColor: '#E6F1FB', borderLeftWidth: 3, borderLeftColor: '#378ADD', padding: '10 14', marginTop: 16, marginBottom: 8 },
  opcoTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0C447C', marginBottom: 4 },
  opcoText: { fontSize: 9, color: '#1a3a5c', lineHeight: 1.5 },
  // CTA
  ctaBox: { backgroundColor: '#f8f8f8', borderWidth: 0.5, borderColor: '#ddd', padding: '14 16', marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ctaLeft: { flex: 1 },
  ctaTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  ctaSub: { fontSize: 9, color: '#666' },
  ctaRight: { fontSize: 9, color: '#666', textAlign: 'right' },
  // Signatures
  signaturesRow: { flexDirection: 'row', gap: 32, marginTop: 28, paddingTop: 16, borderTopWidth: 0.5, borderTopColor: '#ddd' },
  signatureBlock: { flex: 1 },
  signatureLabel: { fontSize: 8, color: '#888', marginBottom: 3 },
  signatureName: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  signatureRole: { fontSize: 9, color: '#666', marginBottom: 28 },
  signatureLine: { borderBottomWidth: 1, borderBottomColor: '#1a1a1a', marginBottom: 3 },
  signatureDateLabel: { fontSize: 8, color: '#888' },
  footer: { position: 'absolute', bottom: 20, left: 50, right: 50, flexDirection: 'row', justifyContent: 'space-between', fontSize: 8, color: '#aaa', borderTopWidth: 0.5, borderTopColor: '#ddd', paddingTop: 6 },
})

function DevisPDF({ d }: { d: any }) {
  return React.createElement(Document, null,
    React.createElement(Page, { size: 'A4', style: styles.page },

      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(View, { style: styles.headerLeft },
          React.createElement(Text, { style: styles.h1 }, d.of_nom),
          React.createElement(Text, { style: styles.grayText }, d.of_adresse),
          React.createElement(Text, { style: styles.grayText }, `SIRET : ${d.of_siret} — N° Qualiopi : ${d.of_qualiopi}`),
          React.createElement(Text, { style: styles.grayText }, `N° déclaration activité : ${d.of_nda ?? '—'}`),
        ),
        React.createElement(View, { style: styles.headerRight },
          React.createElement(Text, { style: { fontSize: 10, fontFamily: 'Helvetica-Bold' } }, `Réf : ${d.reference}`),
          React.createElement(Text, { style: styles.grayText }, `Émis le ${d.date_emission}`),
        ),
      ),

      React.createElement(View, { style: styles.badge },
        React.createElement(Text, null, 'ORGANISME CERTIFIÉ QUALIOPI'),
      ),

      React.createElement(Text, { style: styles.docTitle }, 'Devis de Formation'),
      React.createElement(Text, { style: styles.docRef }, `Référence : ${d.reference}`),
      React.createElement(Text, { style: styles.validite }, `Validité : ${d.date_validite}`),

      // Formation
      React.createElement(Text, { style: styles.sectionTitle }, 'Formation proposée'),
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
          React.createElement(Text, { style: styles.label }, 'Durée'),
          React.createElement(Text, { style: styles.valueNormal }, d.duree),
        ),
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Modalités'),
          React.createElement(Text, { style: styles.valueNormal }, d.modalites),
        ),
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Délai d\'accès'),
          React.createElement(Text, { style: styles.valueNormal }, `${d.delai_acces} jours ouvrés`),
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

      // Programme
      React.createElement(Text, { style: styles.sectionTitle }, 'Programme'),
      React.createElement(View, { style: styles.boxed },
        React.createElement(Text, null, d.programme),
      ),

      // Moyens pédagogiques
      React.createElement(Text, { style: styles.sectionTitle }, 'Moyens pédagogiques & évaluation'),
      React.createElement(View, { style: styles.row2 },
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Méthodes'),
          React.createElement(Text, { style: styles.valueNormal }, d.methodes),
        ),
        React.createElement(View, { style: styles.col },
          React.createElement(Text, { style: styles.label }, 'Évaluation'),
          React.createElement(Text, { style: styles.valueNormal }, d.evaluation),
        ),
      ),

      // Tarif
      React.createElement(Text, { style: styles.sectionTitle }, 'Conditions tarifaires'),
      React.createElement(View, { style: styles.table },
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: { ...styles.th, flex: 2 } }, 'Désignation'),
          React.createElement(Text, { style: styles.th }, 'Durée'),
          React.createElement(Text, { style: styles.thRight }, 'Prix HT'),
          React.createElement(Text, { style: styles.thRight }, 'TVA'),
          React.createElement(Text, { style: styles.thRight }, 'Prix TTC'),
        ),
        React.createElement(View, { style: styles.tableRow },
          React.createElement(Text, { style: { ...styles.td, flex: 2 } }, d.formation_titre),
          React.createElement(Text, { style: styles.td }, d.duree),
          React.createElement(Text, { style: styles.tdRight }, `${d.prix_ht} €`),
          React.createElement(Text, { style: styles.tdRight }, `${d.prix_tva} €`),
          React.createElement(Text, { style: styles.tdRight }, `${d.prix_ttc} €`),
        ),
        React.createElement(View, { style: styles.tableRowTotal },
          React.createElement(Text, { style: { ...styles.tdTotal, flex: 2 } }, 'TOTAL'),
          React.createElement(Text, { style: styles.tdTotal }, ''),
          React.createElement(Text, { style: styles.tdTotalRight }, `${d.prix_ht} €`),
          React.createElement(Text, { style: styles.tdTotalRight }, `${d.prix_tva} €`),
          React.createElement(Text, { style: styles.tdTotalRight }, `${d.prix_ttc} €`),
        ),
      ),
      React.createElement(Text, { style: styles.tvaNote },
        'Exonération de TVA — Article 261-4-4° du CGI (organisme de formation enregistré).'
      ),

      // OPCO
      React.createElement(View, { style: styles.opcoBox },
        React.createElement(Text, { style: styles.opcoTitle }, 'Financement OPCO possible'),
        React.createElement(Text, { style: styles.opcoText },
          'Cette formation peut être prise en charge partiellement ou totalement par votre OPCO (Opérateur de Compétences) dans le cadre du Plan de Développement des Compétences ou du CPF. Contactez-nous pour vous accompagner dans la constitution du dossier de financement.'
        ),
      ),

      // CTA
      React.createElement(View, { style: styles.ctaBox },
        React.createElement(View, { style: styles.ctaLeft },
          React.createElement(Text, { style: styles.ctaTitle }, 'Pour accepter ce devis'),
          React.createElement(Text, { style: styles.ctaSub }, 'Retournez ce document signé avec la mention "Bon pour accord"'),
        ),
        React.createElement(View, { style: styles.ctaRight },
          React.createElement(Text, null, d.of_email),
          React.createElement(Text, null, d.of_telephone ?? ''),
        ),
      ),

      // Signatures
      React.createElement(View, { style: styles.signaturesRow },
        React.createElement(View, { style: styles.signatureBlock },
          React.createElement(Text, { style: styles.signatureLabel }, "Pour l'organisme de formation"),
          React.createElement(Text, { style: styles.signatureName }, d.of_nom),
          React.createElement(Text, { style: styles.signatureRole }, 'Le responsable commercial'),
          React.createElement(View, { style: styles.signatureLine }),
          React.createElement(Text, { style: styles.signatureDateLabel }, 'Signature et cachet — Date : _______________'),
        ),
        React.createElement(View, { style: styles.signatureBlock },
          React.createElement(Text, { style: styles.signatureLabel }, 'Pour le client — Bon pour accord'),
          React.createElement(Text, { style: styles.signatureName }, '___________________________'),
          React.createElement(Text, { style: styles.signatureRole }, 'Nom, fonction, entreprise'),
          React.createElement(View, { style: styles.signatureLine }),
          React.createElement(Text, { style: styles.signatureDateLabel }, 'Signature et cachet — Date : _______________'),
        ),
      ),

      // Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, null, `${d.of_nom} — SIRET ${d.of_siret} — N° Qualiopi ${d.of_qualiopi}`),
        React.createElement(Text, null, `Devis réf. ${d.reference} — Valable jusqu'au ${d.date_validite}`),
      ),
    )
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formation_id, send_email, email_destinataire } = schema.parse(body)

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { data: formation, error: dbError } = await supabase
      .from('formations')
      .select(`
        id, titre, reference, duree, modalites, public_cible,
        prerequis, objectifs_pedagogiques, methodes_pedagogiques,
        moyens_evaluation, accessibilite_handicap, delai_acces_jours,
        prix, prix_ttc, type, programme,
        formateur:formateurs ( prenom, nom )
      `)
      .eq('id', formation_id)
      .single()

    if (dbError || !formation) {
      return NextResponse.json({ error: 'Formation introuvable' }, { status: 404 })
    }

    const prixHT = Number(formation.prix ?? 0)
    const prixTTC = Number(formation.prix_ttc ?? prixHT * 1.2)
    const prixTVA = prixTTC - prixHT
    const reference = generateReference()

    const d = {
      of_nom:           process.env.OF_NOM ?? 'Votre Organisme de Formation',
      of_adresse:       process.env.OF_ADRESSE ?? '—',
      of_siret:         process.env.OF_SIRET ?? '—',
      of_qualiopi:      process.env.OF_QUALIOPI ?? '—',
      of_nda:           process.env.OF_NDA ?? '—',
      of_email:         process.env.OF_EMAIL ?? '—',
      of_telephone:     process.env.OF_TELEPHONE ?? '',
      reference,
      date_emission:    formatDate(new Date().toISOString()),
      date_validite:    dateValidite(),
      formation_titre:  formation.titre,
      formation_reference: formation.reference,
      duree:            formation.duree ?? '—',
      modalites:        formation.modalites ?? '—',
      public_cible:     formation.public_cible ?? '—',
      prerequis:        formation.prerequis ?? 'Aucun',
      objectifs:        formation.objectifs_pedagogiques ?? '—',
      programme:        formation.programme ?? '—',
      methodes:         formation.methodes_pedagogiques ?? '—',
      evaluation:       formation.moyens_evaluation ?? '—',
      delai_acces:      String(formation.delai_acces_jours ?? 15),
      prix_ht:          formatMontant(prixHT),
      prix_tva:         formatMontant(prixTVA),
      prix_ttc:         formatMontant(prixTTC),
    }

    const pdfDoc = pdf(React.createElement(DevisPDF as any, { d }))
const pdfBuffer = Buffer.from(await pdfDoc.toBuffer() as unknown as ArrayBuffer)

    const fileName = `devis/${formation_id}/${reference}.pdf`
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (storageError) console.error('Storage error:', storageError)

    const { data: signedUrl } = await supabase.storage
      .from('documents')
      .createSignedUrl(fileName, 3600)

    if (send_email && email_destinataire) {
      await sendDevisEmail(email_destinataire, formation.titre, pdfBuffer, reference)
    }

    return NextResponse.json({
      success: true,
      reference,
      url: signedUrl?.signedUrl ?? null,
      email_sent: send_email && !!email_destinataire,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    console.error('Devis generation error:', error)
    return NextResponse.json({ error: 'Erreur génération document' }, { status: 500 })
  }
}

async function sendDevisEmail(
  to: string, formationTitre: string, pdfBuffer: Buffer, reference: string
) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: `${process.env.OF_NOM} <${process.env.OF_EMAIL ?? 'onboarding@resend.dev'}>`,
    to,
    subject: `Devis de formation — ${formationTitre} (${reference})`,
    html: `
      <p>Bonjour,</p>
      <p>Veuillez trouver en pièce jointe votre devis pour la formation <strong>${formationTitre}</strong>.</p>
      <p>Ce devis est valable 30 jours. Pour l'accepter, retournez-le signé avec la mention "Bon pour accord".</p>
      <p>N'hésitez pas à nous contacter pour toute question.</p>
      <p>Cordialement,<br>${process.env.OF_NOM}</p>
    `,
    attachments: [{
      filename: `Devis-${reference}.pdf`,
      content: pdfBuffer.toString('base64'),
    }],
  })
}