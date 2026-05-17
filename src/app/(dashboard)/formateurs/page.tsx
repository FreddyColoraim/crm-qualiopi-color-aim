'use client'
import { useState, useEffect } from 'react'

interface Formateur {
  id: string; prenom: string; nom: string; email: string; telephone?: string
  specialite?: string; bio?: string; experience_ans?: number; cv_url?: string
  photo_url?: string
  statut: 'actif' | 'inactif'
  formations?: { id: string; titre: string; reference: string }[]
}

function initials(p: string, n: string) { return `${p[0] ?? ''}${n[0] ?? ''}`.toUpperCase() }

function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 block mb-1.5">{label}</label>
      <input type={type} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

export default function FormateursPage() {
  const [formateurs, setFormateurs] = useState<Formateur[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', specialite: '', bio: '', diplomes: '', experience_ans: '', statut: 'actif' })

  async function load() {
    setLoading(true)
    try { const r = await fetch('/api/formateurs'); setFormateurs(await r.json()) }
    catch { setFormateurs([]) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function reset() { setForm({ prenom: '', nom: '', email: '', telephone: '', specialite: '', bio: '', diplomes: '', experience_ans: '', statut: 'actif' }) }
  function showT(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000) }

  async function save() {
    setSaving(true)
    try {
      const r = await fetch('/api/formateurs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (r.ok) { showT('Formateur ajouté ✓'); setShowModal(false); reset(); load() }
      else { const e = await r.json(); showT(e.error ?? 'Erreur') }
    } catch { showT('Erreur réseau') } finally { setSaving(false) }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {toast && <div className="fixed top-6 right-6 z-50 bg-[#BE185D] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">{toast}</div>}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Formateurs</h1>
          <p className="text-sm text-gray-500 mt-1">{formateurs.length} formateur{formateurs.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { reset(); setShowModal(true) }} className="flex items-center gap-2 px-4 py-2.5 bg-[#BE185D] text-white rounded-xl text-sm font-medium hover:bg-[#9d1550] transition-colors">+ Nouveau formateur</button>
      </div>

      {loading ? <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Chargement…</div>
      : formateurs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">👤</div>
          <p className="text-sm">Aucun formateur enregistré</p>
          <button onClick={() => setShowModal(true)} className="mt-4 text-[#BE185D] text-sm font-medium hover:underline">Ajouter le premier formateur →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {formateurs.map(f => (
            <div key={f.id} onClick={() => setSelected(selected === f.id ? null : f.id)} className="bg-white border border-gray-100 rounded-2xl p-5 cursor-pointer hover:border-[#BE185D]/30 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                {f.photo_url ? <img src={f.photo_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                : <div className="w-12 h-12 rounded-full bg-[#fdf2f8] flex items-center justify-center text-[#BE185D] font-semibold text-sm">{initials(f.prenom, f.nom)}</div>}
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{f.prenom} {f.nom}</div>
                  <div className="text-xs text-gray-400">{f.specialite ?? 'Formateur'}</div>
                </div>
                <span className={`ml-auto text-xs px-2 py-1 rounded-full font-medium ${f.statut === 'actif' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{f.statut}</span>
              </div>
              <div className="space-y-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-2">✉ <span className="truncate">{f.email}</span></div>
                {f.telephone && <div className="flex items-center gap-2">📞 {f.telephone}</div>}
                {!!f.experience_ans && <div className="flex items-center gap-2">⭐ {f.experience_ans} ans d'expérience</div>}
              </div>
              {f.formations && f.formations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <div className="text-xs text-gray-400 mb-2">Formations</div>
                  <div className="flex flex-wrap gap-1.5">
                    {f.formations.map(fo => <span key={fo.id} className="text-xs bg-[#fdf2f8] text-[#BE185D] px-2 py-0.5 rounded-full">{fo.reference}</span>)}
                  </div>
                </div>
              )}
              {selected === f.id && f.bio && <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-600 leading-relaxed">{f.bio}</div>}
              {selected === f.id && f.cv_url && (
                <div className="mt-3"><a href={f.cv_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-xs py-2 px-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">📄 Voir le CV</a></div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Nouveau formateur</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Prénom *" value={form.prenom} onChange={v => setForm(f => ({ ...f, prenom: v }))} placeholder="Maud" />
                <Field label="Nom *" value={form.nom} onChange={v => setForm(f => ({ ...f, nom: v }))} placeholder="Batellier" />
              </div>
              <Field label="Email *" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} type="email" placeholder="maud@coloraim.fr" />
              <Field label="Téléphone" value={form.telephone} onChange={v => setForm(f => ({ ...f, telephone: v }))} placeholder="06 12 34 56 78" />
              <Field label="Spécialité" value={form.specialite} onChange={v => setForm(f => ({ ...f, specialite: v }))} placeholder="Colorimétrie, ICC…" />
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Biographie</label>
                <textarea rows={3} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30 resize-none" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Expert en arts graphiques…" />
              </div>
              <Field label="Années d'expérience" value={form.experience_ans} onChange={v => setForm(f => ({ ...f, experience_ans: v }))} type="number" placeholder="15" />
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Statut</label>
                <select className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30 bg-white" value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={save} disabled={saving || !form.prenom || !form.nom || !form.email} className="flex-1 py-2.5 bg-[#BE185D] text-white rounded-xl text-sm font-medium hover:bg-[#9d1550] transition-colors disabled:opacity-40">
                {saving ? 'Enregistrement…' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
