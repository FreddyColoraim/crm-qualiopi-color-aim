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

    const prompt = `Tu es un expert Qualiopi spécialisé dans l'accompagnement des organismes de formation.
Tu analyses les indicateurs de Color Aim, organisme de formation photographique certifié Qualiopi à Bordeaux.
Référente qualité : Maud Batellier (diplômée ENS Louis Lumière, spécialiste ICC depuis 2006).

SCORE GLOBAL : ${scoreGlobal}%
PROCHAIN AUDIT : 15/11/2026

INDICATEURS :
${indicateurs.map(i => `- Critère ${i.numero_critere} — ${i.libelle} : ${i.score}%${i.detail ? ` (${i.detail})` : ''}`).join('\n')}

${actions_en_cours && actions_en_cours.length > 0 ? `ACTIONS EN COURS :
${actions_en_cours.map(a => `- Critère ${a.numero_critere} : ${a.description} → ${a.statut} (échéance ${a.date_limite})`).join('\n')}` : ''}

CRITÈRES PRIORITAIRES (score < 95%) :
${criteresFaibles.length > 0 ? criteresFaibles.map(i => `- Critère ${i.numero_critere} : ${i.score}%`).join('\n') : 'Aucun'}

Réponds UNIQUEMENT avec ce JSON :
{
  "score_global": ${scoreGlobal},
  "niveau": "Excellent|Bon|À améliorer|Critique",
  "synthese": "2-3 phrases sur la situation Color Aim",
  "recommandations": [
    {
      "critere": 7,
      "libelle": "Amélioration continue",
      "priorite": "haute|moyenne|faible",
      "action": "Action concrète avec verbe",
      "impact": "Bénéfice pour l'audit",
      "delai_suggere": "Avant le JJ/MM/AAAA",
      "ressources": "Ce dont Maud a besoin"
    }
  ],
  "points_forts": ["Point 1", "Point 2", "Point 3"],
  "alerte_audit": "Message urgent si score < 85% sinon null"
}`

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Données invalides' }, { status: 400 })
    }
    console.error('Erreur Claude:', error)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
