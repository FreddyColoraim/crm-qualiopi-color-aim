'use client'
import { EmailPanel } from './EmailPanel'

interface Props {
  candidatId: string
  candidatNom: string
  candidatEmail: string
  formation?: string
  formationId?: string
  dateDebut?: string
  dateFin?: string
  prix?: string
}

export function EmailButtonWrapper(props: Props) {
  return <EmailPanel {...props} />
}
