import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { recommandationsSchema } from '@/lib/validations'
import { z } from 'zod'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { indicateurs, actions_en_cours } = recommandationsSchema.parse(body)

    const scoreGlobal = Math.round(
      indicateurs.reduce((s, i) => s + i.score, 0) / indicateurs.length
    )
    const criteresFaibles = indicateurs.filter(i => i.score < 95)

    const prompt = `Tu es un expert Qualiopi pour Color Aim, organisme de formation photographique à Bordeaux.
Référente qualité : Maud Batellier.

SCORE GLOBAL : ${scoreGlobal}%
PROCHAIN AUDIT : 15/11/2026

INDICATEURS :
${indicateurs.map(i => `- Critère ${i.numero_critere} — ${i.libelle} : ${i.score}%${i.detail ? ` (${i.detail})` : ''}`).join('\n')}

${actions_en_cours && actions_en_cours.length > 0 ? `ACTIONS EN COURS :
${actions_en_cours.map(a => `- Critère ${a.numero_critere} : ${a.description} → ${a.statut}`).join('\n')}` : ''}

Réponds UNIQUEMENT avec un objet JSON valide, sans backticks, sans markdown, sans texte avant ou après :
{"score_global":${scoreGlobal},"niveau":"Excellent|Bon|À améliorer|Critique","synthese":"2-3 phrases","recommandations":[{"critere":1,"libelle":"...","priorite":"haute|moyenne|faible","action":"...","impact":"...","delai_suggere":"...","ressources":"..."}],"points_forts":["..."],"alerte_audit":null}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    return Response.json(JSON.parse(clean))
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Données invalides' }, { status: 400 })
    }
    console.error('Erreur Claude:', error)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}