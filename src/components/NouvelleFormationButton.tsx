'use client'
import { useState } from 'react'
import { NouvelleFormationModal } from './NouvelleFormationModal'

interface Formateur {
  id: string; prenom: string; nom: string; specialite?: string
}

export function NouvelleFormationButton({ formateurs = [] }: { formateurs?: Formateur[] }) {
  const [show, setShow] = useState(false)
  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#A0195B] text-white rounded-xl text-sm font-medium hover:bg-[#8a1550] transition-colors flex-shrink-0"
      >
        + Nouvelle formation
      </button>
      {show && (
        <NouvelleFormationModal
          formateurs={formateurs}
          onSuccess={() => { setShow(false); window.location.reload() }}
          onClose={() => setShow(false)}
        />
      )}
    </>
  )
}
