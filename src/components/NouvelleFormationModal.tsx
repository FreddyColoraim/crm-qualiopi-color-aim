'use client'
import { useState } from 'react'

interface Session { date_debut: string; date_fin: string; places_max: number }
interface Formateur { id: string; prenom: string; nom: string; specialite?: string }
interface Props { formateurs?: Formateur[]; onSuccess?: (id: string) => void; onClose?: () => void }

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1.5">{label}</label>
      <input type={type} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}
function TextArea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1.5">{label}</label>
      <textarea rows={rows} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30 resize-none" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}
function fmt(d: string) { return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '' }

export function NouvelleFormationModal({ formateurs = [], onSuccess, onClose }: Props) {
  const [step, setStep] = useState<1|2|3>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ titre: '', type: 'formation', categorie: 'Arts graphiques', duree_heures: '', modalite: 'Présentiel', prix_ht: '', formateur_id: '' })
  const [peda, setPeda] = useState({ description: '', objectifs_pedagogiques: '', programme: '', public_cible: '', prerequis: '', methodes_pedagogiques: '', moyens_evaluation: '', accessibilite_handicap: 'Locaux accessibles PMR.', delai_acces: '7 jours ouvrés' })
  const [sessions, setSessions] = useState<Session[]>([])
  const [ns, setNs] = useState({ date_debut: '', date_fin: '', places_max: '8' })

  function addSession() {
    if (!ns.date_debut || !ns.date_fin) return
    setSessions(s => [...s, { date_debut: ns.date_debut, date_fin: ns.date_fin, places_max: Number(ns.places_max) || 8 }])
    setNs({ date_debut: '', date_fin: '', places_max: '8' })
  }

  async function save() {
    setSaving(true); setError(null)
    try {
      const r = await fetch('/api/formations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, ...peda, duree_heures: Number(form.duree_heures), prix_ht: Number(form.prix_ht), formateur_id: form.formateur_id || undefined, sessions_initiales: sessions }) })
      const data = await r.json()
      if (!r.ok) { setError(data.error ?? 'Erreur'); return }
      onSuccess?.(data.formation.id)
    } catch { setError('Erreur réseau') } finally { setSaving(false) }
  }

  const steps = [{ num: 1, label: 'Infos générales' }, { num: 2, label: 'Pédagogie' }, { num: 3, label: 'Sessions' }]

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Nouvelle formation</h2>
            <p className="text-xs text-gray-400 mt-0.5">Étape {step}/3 — {steps[step-1].label}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        <div className="flex gap-2 px-6 pt-4 flex-shrink-0">
          {steps.map(s => (
            <button key={s.num} onClick={() => { if (s.num < step) setStep(s.num as 1|2|3) }} className={`flex-1 py-2 text-xs rounded-lg font-medium transition-colors ${step === s.num ? 'bg-[#BE185D] text-white' : s.num < step ? 'bg-[#fdf2f8] text-[#BE185D] cursor-pointer' : 'bg-gray-50 text-gray-400 cursor-default'}`}>
              {s.num < step ? '✓ ' : ''}{s.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {step === 1 && (
            <>
              <Field label="Titre *" value={form.titre} onChange={v => setForm(f => ({ ...f, titre: v }))} placeholder="Maîtriser la colorimétrie ICC" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Type *</label>
                  <select className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30 bg-white" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="formation">Formation (2j+)</option>
                    <option value="atelier">Atelier (1j)</option>
                    <option value="masterclass">Masterclass (½j)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Modalité *</label>
                  <select className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30 bg-white" value={form.modalite} onChange={e => setForm(f => ({ ...f, modalite: e.target.value }))}>
                    <option>Présentiel</option><option>Distanciel</option><option>Hybride</option>
                  </select>
                </div>
                <Field label="Durée (heures) *" value={form.duree_heures} onChange={v => setForm(f => ({ ...f, duree_heures: v }))} type="number" placeholder="21" />
                <Field label="Prix HT (€) *" value={form.prix_ht} onChange={v => setForm(f => ({ ...f, prix_ht: v }))} type="number" placeholder="1200" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Catégorie</label>
                <select className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30 bg-white" value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}>
                  <option>Arts graphiques</option><option>Photographie</option><option>Impression & prépresse</option><option>Colorimétrie</option><option>Gestion de projet</option><option>Outils Adobe</option>
                </select>
              </div>
              {formateurs.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Formateur</label>
                  <select className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30 bg-white" value={form.formateur_id} onChange={e => setForm(f => ({ ...f, formateur_id: e.target.value }))}>
                    <option value="">— Sélectionner</option>
                    {formateurs.map(fo => <option key={fo.id} value={fo.id}>{fo.prenom} {fo.nom}</option>)}
                  </select>
                </div>
              )}
            </>
          )}
          {step === 2 && (
            <>
              <TextArea label="Description" value={peda.description} onChange={v => setPeda(p => ({ ...p, description: v }))} placeholder="Maîtrisez les fondamentaux…" rows={2} />
              <TextArea label="Objectifs pédagogiques *" value={peda.objectifs_pedagogiques} onChange={v => setPeda(p => ({ ...p, objectifs_pedagogiques: v }))} placeholder="À l'issue, le stagiaire sera capable de…" rows={3} />
              <TextArea label="Programme" value={peda.programme} onChange={v => setPeda(p => ({ ...p, programme: v }))} placeholder="Jour 1 : …" rows={4} />
              <Field label="Public cible" value={peda.public_cible} onChange={v => setPeda(p => ({ ...p, public_cible: v }))} placeholder="Graphistes, photographes…" />
              <Field label="Prérequis" value={peda.prerequis} onChange={v => setPeda(p => ({ ...p, prerequis: v }))} placeholder="Connaissance Adobe…" />
              <Field label="Méthodes pédagogiques" value={peda.methodes_pedagogiques} onChange={v => setPeda(p => ({ ...p, methodes_pedagogiques: v }))} placeholder="Exposés, ateliers pratiques…" />
              <Field label="Moyens d'évaluation" value={peda.moyens_evaluation} onChange={v => setPeda(p => ({ ...p, moyens_evaluation: v }))} placeholder="QCM + évaluation pratique" />
              <Field label="Délai d'accès" value={peda.delai_acces} onChange={v => setPeda(p => ({ ...p, delai_acces: v }))} placeholder="7 jours ouvrés" />
              <TextArea label="Accessibilité handicap" value={peda.accessibilite_handicap} onChange={v => setPeda(p => ({ ...p, accessibilite_handicap: v }))} rows={2} />
            </>
          )}
          {step === 3 && (
            <>
              <p className="text-xs text-gray-400">Ajoutez les premières sessions. Vous pouvez en ajouter d'autres depuis la fiche formation.</p>
              {sessions.length > 0 && (
                <div className="space-y-2">
                  {sessions.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#fdf2f8] rounded-xl px-4 py-3">
                      <div className="text-sm text-gray-700"><span className="font-medium">{fmt(s.date_debut)}</span><span className="text-gray-400 mx-2">→</span><span className="font-medium">{fmt(s.date_fin)}</span><span className="text-xs text-gray-400 ml-3">{s.places_max} places</span></div>
                      <button onClick={() => setSessions(ss => ss.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 text-lg">×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="text-xs font-medium text-gray-500">Ajouter une session</div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-xs text-gray-500 block mb-1">Début</label><input type="date" className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30" value={ns.date_debut} onChange={e => setNs(s => ({ ...s, date_debut: e.target.value }))} /></div>
                  <div><label className="text-xs text-gray-500 block mb-1">Fin</label><input type="date" className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30" value={ns.date_fin} onChange={e => setNs(s => ({ ...s, date_fin: e.target.value }))} /></div>
                  <div><label className="text-xs text-gray-500 block mb-1">Places</label><input type="number" min="1" max="30" className="w-full text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30" value={ns.places_max} onChange={e => setNs(s => ({ ...s, places_max: e.target.value }))} /></div>
                </div>
                <button onClick={addSession} disabled={!ns.date_debut || !ns.date_fin} className="w-full py-2 bg-[#BE185D]/10 text-[#BE185D] rounded-lg text-sm font-medium hover:bg-[#BE185D]/20 transition-colors disabled:opacity-40">+ Ajouter cette session</button>
              </div>
            </>
          )}
          {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</div>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          {step > 1 && <button onClick={() => setStep(s => (s-1) as 1|2|3)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">← Retour</button>}
          <button onClick={onClose} className={`py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors ${step === 1 ? 'flex-1' : 'px-4'}`}>Annuler</button>
          {step < 3
            ? <button onClick={() => { if (step === 1 && (!form.titre || !form.duree_heures || !form.prix_ht)) { setError('Remplissez les champs obligatoires (*)'); return }; setError(null); setStep(s => (s+1) as 1|2|3) }} className="flex-1 py-2.5 bg-[#BE185D] text-white rounded-xl text-sm font-medium hover:bg-[#9d1550] transition-colors">Suivant →</button>
            : <button onClick={save} disabled={saving} className="flex-1 py-2.5 bg-[#BE185D] text-white rounded-xl text-sm font-medium hover:bg-[#9d1550] transition-colors disabled:opacity-40">{saving ? 'Création…' : '✓ Créer la formation'}</button>
          }
        </div>
      </div>
    </div>
  )
}
