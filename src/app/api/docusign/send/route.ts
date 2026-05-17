import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DS_BASE = process.env.DOCUSIGN_BASE_URL ?? 'https://demo.docusign.net'
const DS_ACCOUNT = process.env.DOCUSIGN_ACCOUNT_ID ?? ''
let _token: string | null = null; let _expiry = 0

async function getToken(): Promise<string> {
  if (_token && Date.now() < _expiry) return _token
  if (!process.env.DOCUSIGN_INTEGRATION_KEY) { _token = 'DEMO'; _expiry = Date.now() + 3_600_000; return _token }
  throw new Error('DocuSign non configuré')
}

export async function POST(req: NextRequest) {
  try {
    const { signerEmail, signerName, documentType, documentBase64, documentName, candidatId, inscriptionId } = await req.json()
    if (!signerEmail || !signerName || !documentType)
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    const supabase = await createClient()
    const isDemo = !process.env.DOCUSIGN_INTEGRATION_KEY
    if (isDemo) {
      const fakeId = `DEMO-${Date.now()}`
      const fakeLink = `https://demo.docusign.net/signing/${fakeId}`
      await supabase.from('documents').insert({
        candidat_id: candidatId, inscription_id: inscriptionId,
        type: documentType, nom: documentName ?? `${documentType}.pdf`,
        statut: 'en attente de signature', lien_signature: fakeLink,
        docusign_envelope_id: fakeId, sent_at: new Date().toISOString(),
      })
      return NextResponse.json({ success: true, demo: true, envelopeId: fakeId, signingUrl: fakeLink })
    }
    const token = await getToken()
    const envelope = {
      emailSubject: `[Color Aim] ${documentType} — signature requise`,
      documents: [{ documentId: '1', name: documentName ?? `${documentType}.pdf`, fileExtension: 'pdf', documentBase64: documentBase64 ?? btoa('Color Aim') }],
      recipients: { signers: [{ email: signerEmail, name: signerName, recipientId: '1', routingOrder: '1' }] },
      status: 'sent',
    }
    const dsRes = await fetch(`${DS_BASE}/restapi/v2.1/accounts/${DS_ACCOUNT}/envelopes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
    })
    if (!dsRes.ok) return NextResponse.json({ error: 'DocuSign error', detail: await dsRes.text() }, { status: 502 })
    const { envelopeId } = await dsRes.json()
    await supabase.from('documents').insert({
      candidat_id: candidatId, inscription_id: inscriptionId,
      type: documentType, nom: documentName ?? `${documentType}.pdf`,
      statut: 'en attente de signature', docusign_envelope_id: envelopeId,
      sent_at: new Date().toISOString(),
    })
    return NextResponse.json({ success: true, envelopeId })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const envelopeId = req.nextUrl.searchParams.get('envelopeId')
  if (!envelopeId) return NextResponse.json({ error: 'envelopeId requis' }, { status: 400 })
  if (envelopeId.startsWith('DEMO-')) return NextResponse.json({ status: 'sent', demo: true })
  try {
    const token = await getToken()
    const res = await fetch(`${DS_BASE}/restapi/v2.1/accounts/${DS_ACCOUNT}/envelopes/${envelopeId}`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    if (data.status === 'completed') {
      const supabase = await createClient()
      await supabase.from('documents').update({ statut: 'signé', signed_at: new Date().toISOString() }).eq('docusign_envelope_id', envelopeId)
    }
    return NextResponse.json({ status: data.status })
  } catch { return NextResponse.json({ error: 'Erreur DocuSign' }, { status: 500 }) }
}
