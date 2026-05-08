'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Save, Loader2 } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface FormData {
  prenom: string
  nom: string
  email: string
  telephone: string
  entreprise: string
  poste: string
  financeur: string
  numero_dossier: string
}

const FINANCEURS = ['', 'AFDAS', 'FAFCEA', "L'Opcommerce", 'OPCO 2i', 'CPF']

const INITIAL: FormData = {
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  entreprise: '',
  poste: '',
  financeur: '',
  numero_dossier: '',
}

// ─── Composant champ ─────────────────────────────────────────────────────────
function Champ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  error,
}: {
  label: string
  id: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  error?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-[#A0195B] ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-1 transition-colors ${
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
            : 'border-gray-200 focus:border-[#A0195B] focus:ring-[#A0195B]/20'
        }`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function NouveauCandidatPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(INITIAL)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [loading, setLoading] = useState(false)
  const [erreurServeur, setErreurServeur] = useState('')

  function set(field: keyof FormData) {
    return (value: string) => {
      setForm(prev => ({ ...prev, [field]: value }))
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  function valider(): boolean {
    const e: Partial<FormData> = {}
    if (!form.prenom.trim()) e.prenom = 'Le prénom est obligatoire'
    if (!form.nom.trim()) e.nom = 'Le nom est obligatoire'
    if (!form.email.trim()) {
      e.email = "L'email est obligatoire"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Format d'email invalide"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valider()) return

    setLoading(true)
    setErreurServeur('')

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('candidats')
        .insert({
          prenom: form.prenom.trim(),
          nom: form.nom.trim(),
          email: form.email.trim().toLowerCase(),
          telephone: form.telephone.trim() || null,
          entreprise: form.entreprise.trim() || null,
          poste: form.poste.trim() || null,
          financeur: form.financeur || null,
          numero_dossier: form.numero_dossier.trim() || null,
        })
        .select('id')
        .single()

      if (error) {
        if (error.code === '23505') {
          setErreurServeur('Un candidat avec cet email existe déjà.')
        } else {
          setErreurServeur("Erreur lors de la création. Réessayez.")
        }
        return
      }

      // Rediriger vers la fiche du nouveau candidat
      router.push(`/candidats/${data.id}`)
    } catch {
      setErreurServeur("Erreur inattendue. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  // Générer un numéro de dossier automatique
  function genererNumero() {
    const annee = new Date().getFullYear()
    const num = Math.floor(Math.random() * 9000) + 1000
    set('numero_dossier')(`CA-${annee}-${num}`)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Retour */}
      <Link
        href="/candidats"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#A0195B] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux candidats
      </Link>

      {/* En-tête */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#FEE7F0] rounded-xl flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-[#A0195B]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Nouveau candidat</h1>
          <p className="text-sm text-gray-500">Remplissez les informations du candidat</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Identité */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Identité
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Champ
              label="Prénom" id="prenom"
              value={form.prenom} onChange={set('prenom')}
              placeholder="Thomas" required error={errors.prenom}
            />
            <Champ
              label="Nom" id="nom"
              value={form.nom} onChange={set('nom')}
              placeholder="Renard" required error={errors.nom}
            />
            <Champ
              label="Email" id="email" type="email"
              value={form.email} onChange={set('email')}
              placeholder="thomas@studio.fr" required error={errors.email}
            />
            <Champ
              label="Téléphone" id="telephone"
              value={form.telephone} onChange={set('telephone')}
              placeholder="06 12 34 56 78"
            />
          </div>
        </div>

        {/* Entreprise */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Entreprise
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Champ
              label="Entreprise" id="entreprise"
              value={form.entreprise} onChange={set('entreprise')}
              placeholder="Studio Photo Renard"
            />
            <Champ
              label="Poste" id="poste"
              value={form.poste} onChange={set('poste')}
              placeholder="Photographe indépendant"
            />
          </div>
        </div>

        {/* Financement & dossier */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Financement & dossier
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Financeur */}
            <div>
              <label htmlFor="financeur" className="block text-sm font-medium text-gray-700 mb-1.5">
                Financeur
              </label>
              <select
                id="financeur"
                value={form.financeur}
                onChange={e => set('financeur')(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#A0195B] focus:ring-1 focus:ring-[#A0195B]/20"
              >
                {FINANCEURS.map(f => (
                  <option key={f} value={f}>{f || '— Sélectionner —'}</option>
                ))}
              </select>
            </div>

            {/* Numéro dossier */}
            <div>
              <label htmlFor="numero_dossier" className="block text-sm font-medium text-gray-700 mb-1.5">
                N° dossier
              </label>
              <div className="flex gap-2">
                <input
                  id="numero_dossier"
                  type="text"
                  value={form.numero_dossier}
                  onChange={e => set('numero_dossier')(e.target.value)}
                  placeholder="CA-2026-0051"
                  className="flex-1 px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-[#A0195B] focus:ring-1 focus:ring-[#A0195B]/20"
                />
                <button
                  type="button"
                  onClick={genererNumero}
                  className="px-3 py-2.5 text-xs font-medium text-[#A0195B] border border-[#A0195B] rounded-xl hover:bg-[#FEE7F0] transition-colors whitespace-nowrap"
                >
                  Générer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Erreur serveur */}
        {erreurServeur && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {erreurServeur}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/candidats"
            className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-[#A0195B] text-white rounded-xl hover:bg-[#8A1548] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Enregistrement…' : 'Créer le candidat'}
          </button>
        </div>
      </form>
    </div>
  )
}
