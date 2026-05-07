import { z } from 'zod'

export const sendEmailSchema = z.object({
  document_id: z.string().uuid(),
  destinataire: z.string().email(),
  sujet: z.string().min(1),
  contenu: z.string().min(1),
  piece_jointe: z.object({
    nom: z.string(),
    chemin: z.string(),
  }).optional(),
})

export const docusignSchema = z.object({
  document_id: z.string().uuid(),
  email: z.string().email(),
  nom: z.string().min(1),
  documentName: z.string().min(1),
  documentUrl: z.string().url(),
})

export const opcoSchema = z.object({
  inscription_id: z.string().uuid(),
  type_financement: z.enum(['AFDAS', 'FAFCEA', "L'Opcommerce", 'OPCO 2i', 'CPF']),
  montant: z.number().positive(),
})

export const indicateurSchema = z.object({
  score: z.number().min(0).max(100),
  detail: z.string().optional(),
})

export const actionSchema = z.object({
  numero_critere: z.number().min(1).max(7),
  description: z.string().min(1),
  responsable: z.string().default('Maud Batellier'),
  date_limite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  statut: z.enum(['planifiée', 'en cours', 'en retard', 'clôturée']).optional(),
  commentaire: z.string().optional(),
})

export const updateActionSchema = z.object({
  statut: z.enum(['planifiée', 'en cours', 'en retard', 'clôturée']).optional(),
  commentaire: z.string().optional(),
})

export const veilleSchema = z.object({
  titre: z.string().min(1),
  description: z.string().min(1),
  categorie: z.enum(['Réglementation', 'Financement', 'Certification', 'Réforme', 'CPF', 'Opportunité']),
  niveau_impact: z.enum(['élevé', 'moyen', 'faible']).default('moyen'),
  source: z.string().optional(),
  url_source: z.string().url().optional(),
  date_publication: z.string().optional(),
  epinglee: z.boolean().default(false),
})

export const recommandationsSchema = z.object({
  indicateurs: z.array(z.object({
    numero_critere: z.number().min(1).max(7),
    libelle: z.string(),
    score: z.number().min(0).max(100),
    detail: z.string().optional(),
  })),
  actions_en_cours: z.array(z.object({
    numero_critere: z.number(),
    description: z.string(),
    statut: z.string(),
    date_limite: z.string(),
  })).optional(),
})
