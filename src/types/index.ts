export type Financeur = 'AFDAS' | 'FAFCEA' | "L'Opcommerce" | 'OPCO 2i' | 'CPF'
export type StatutInscription = 'en attente' | 'validée' | 'annulée'
export type StatutDocument = 'non envoyé' | 'envoyé' | 'en attente de signature' | 'validé' | 'refusé'
export type StatutSession = 'planifiée' | 'confirmée' | 'complet' | 'presque complet' | 'annulée'
export type StatutAction = 'planifiée' | 'en cours' | 'en retard' | 'clôturée'
export type TypeDocument = 'devis' | 'convention' | 'convocation' | 'reglement' | 'attestation'
export type TypeFinancement = 'AFDAS' | 'FAFCEA' | "L'Opcommerce" | 'OPCO 2i' | 'CPF'
export type CategorieVeille = 'Réglementation' | 'Financement' | 'Certification' | 'Réforme' | 'CPF' | 'Opportunité'
export type NiveauImpact = 'élevé' | 'moyen' | 'faible'

export interface Candidat {
  id: string
  created_at: string
  nom: string
  prenom: string
  email: string
  telephone?: string
  entreprise?: string
  poste?: string
  financeur?: Financeur
  numero_dossier?: string
}

export interface Formation {
  id: string
  titre: string
  reference: string
  duree?: string
  modalites?: string
  effectif?: string
  prix?: number
  public_cible?: string
  prerequis?: string
  description?: string
  programme?: string
  delai_acces_jours: number
}

export interface Session {
  id: string
  formation_id: string
  date_debut: string
  date_fin: string
  places_max: number
  places_restantes: number
  statut: StatutSession
  formation?: Formation
}

export interface Inscription {
  id: string
  candidat_id: string
  formation_id: string
  session_id?: string
  date_inscription: string
  statut: StatutInscription
  date_validation?: string
  candidat?: Candidat
  formation?: Formation
  session?: Session
  documents?: Document[]
  demandes_opco?: DemandeOPCO[]
}

export interface Document {
  id: string
  inscription_id: string
  type: TypeDocument
  nom: string
  chemin?: string
  statut: StatutDocument
  date_envoi?: string
  date_validation?: string
  lien_signature?: string
}

export interface DemandeOPCO {
  id: string
  inscription_id: string
  type_financement: TypeFinancement
  montant: number
  statut: 'en attente' | 'validée' | 'refusée'
  reference?: string
  date_demande: string
  date_reponse?: string
}

export interface IndicateurQualiopi {
  id: string
  numero_critere: number
  libelle: string
  score: number
  detail?: string
  date_mise_a_jour: string
}

export interface ActionCorrective {
  id: string
  numero_critere: number
  description: string
  responsable: string
  date_limite: string
  statut: StatutAction
  date_cloture?: string
  commentaire?: string
}

export interface VeilleActualite {
  id: string
  titre: string
  description: string
  categorie: CategorieVeille
  niveau_impact: NiveauImpact
  source?: string
  url_source?: string
  date_publication?: string
  statut: 'active' | 'archivée'
  epinglee: boolean
}

export interface RecommandationIA {
  critere: number
  libelle: string
  priorite: 'haute' | 'moyenne' | 'faible'
  action: string
  impact: string
  delai_suggere: string
  ressources: string
}

export interface AnalyseIA {
  score_global: number
  niveau: 'Excellent' | 'Bon' | 'À améliorer' | 'Critique'
  synthese: string
  recommandations: RecommandationIA[]
  points_forts: string[]
  alerte_audit: string | null
}
