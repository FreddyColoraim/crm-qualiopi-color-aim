import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SGEvent {
  email: string
  event: 'open' | 'click' | 'delivered' | 'bounce' | 'spamreport' | 'unsubscribe'
  timestamp: number
}

export async function POST(req: NextRequest) {
  try {
    const events: SGEvent[] = await req.json()
    const supabase = await createClient()
    for (const { email, event: type, timestamp } of events) {
      const at = new Date(timestamp * 1000).toISOString()
      const { data: rec } = await supabase.from('emails').select('id,statut')
        .eq('destinataire', email).order('sent_at', { ascending: false }).limit(1).single()
      if (!rec) continue
      const map: Record<string, { statut: string; field?: string }> = {
        delivered: { statut: 'livré', field: 'delivered_at' },
        open:      { statut: 'ouvert', field: 'opened_at' },
        click:     { statut: 'cliqué', field: 'clicked_at' },
        bounce:    { statut: 'bounced' },
        spamreport:{ statut: 'spam' },
        unsubscribe:{ statut: 'désabonné' },
      }
      const entry = map[type]
      if (!entry) continue
      const update: Record<string, string> = { statut: entry.statut }
      if (entry.field) update[entry.field] = at
      await supabase.from('emails').update(update).eq('id', rec.id)
    }
    return NextResponse.json({ received: events.length })
  } catch {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
