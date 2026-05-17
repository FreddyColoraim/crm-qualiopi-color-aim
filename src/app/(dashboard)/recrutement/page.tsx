'use client'
import { useState, useEffect, useRef } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Prospect {
  id: string; prenom?: string; nom: string; email: string; telephone?: string
  entreprise?: string; metier?: string; source?: string; statut: string
  formation_interesse?: string; notes?: string; created_at: string
}
interface Campagne {
  id: string; nom: string; type: string; canal: string; statut: string
  sujet?: string; nb_destinataires: number; nb_ouvertures: number
  nb_clics: number; nb_conversions: number; sent_at?: string; created_at: string
  formations?: { titre: string; reference: string }
}
interface StatSatisfaction {
  questionnaires: Array<{ note_globale?: number; repondu_at?: string; candidats?: { prenom: string; nom: string }; formations?: { titre: string } }>
  nps: number | null; total: number; repondus: number
}

// ─── Config ───────────────────────────────────────────────────────────────────
const METIERS = ['graphiste','photographe','imprimeur','illustrateur','agence','artiste','autre']
const SOURCES = ['site_web','instagram','linkedin','facebook','partenaire','manuel','csv']
const STATUTS = ['nouveau','contacté','inscrit','abandonné']
const CANAUX  = ['brevo','instagram','linkedin','facebook']

const sourceIcon: Record<string, string> = {
  instagram: '📸', linkedin: '💼', facebook: '👥',
  site_web: '🌐', partenaire: '🤝', manuel: '✏️', csv: '📊'
}
const statutColors: Record<string, string> = {
  nouveau:    'bg-blue-50 text-blue-700',
  contacté:   'bg-amber-50 text-amber-700',
  inscrit:    'bg-green-50 text-green-700',
  abandonné:  'bg-gray-100 text-gray-500',
}
const canalColors: Record<string, string> = {
  brevo: 'bg-blue-50 text-blue-700', instagram: 'bg-pink-50 text-pink-700',
  linkedin: 'bg-sky-50 text-sky-700', facebook: 'bg-indigo-50 text-indigo-700',
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RecrutementPage() {
  const [tab, setTab] = useState<'acquisition'|'prospects'|'campagnes'|'social'|'satisfaction'>('acquisition')
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [campagnes, setCampagnes] = useState<Campagne[]>([])
  const [satisfaction, setSatisfaction] = useState<StatSatisfaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  async function loadAll() {
    setLoading(true)
    const [pr, ca, sa] = await Promise.all([
      fetch('/api/prospects').then(r => r.json()),
      fetch('/api/campagnes').then(r => r.json()),
      fetch('/api/satisfaction').then(r => r.json()),
    ])
    setProspects(Array.isArray(pr) ? pr : [])
    setCampagnes(Array.isArray(ca) ? ca : [])
    setSatisfaction(sa)
    setLoading(false)
  }
  useEffect(() => { loadAll() }, [])

  const tabs = [
    { id: 'acquisition', label: 'Acquisition', icon: '📊' },
    { id: 'prospects',   label: 'Prospects',   icon: '👥' },
    { id: 'campagnes',   label: 'Campagnes',   icon: '✉️' },
    { id: 'social',      label: 'Réseaux',      icon: '📱' },
    { id: 'satisfaction',label: 'Satisfaction', icon: '⭐' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && <div className="fixed top-6 right-6 z-50 bg-[#BE185D] text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">{toast}</div>}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Recrutement & Communication</h1>
        <p className="text-sm text-gray-500 mt-1">De l'acquisition au questionnaire de satisfaction</p>
      </div>

      {/* KPIs rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Prospects', value: prospects.length, icon: '👥', color: 'text-blue-600' },
          { label: 'Convertis', value: prospects.filter(p => p.statut === 'inscrit').length, icon: '✅', color: 'text-green-600' },
          { label: 'Campagnes', value: campagnes.length, icon: '✉️', color: 'text-[#BE185D]' },
          { label: 'NPS Score', value: satisfaction?.nps ? `${satisfaction.nps}/10` : '—', icon: '⭐', color: 'text-amber-600' },
        ].map(k => (
          <div key={k.label} className="bg-white border border-gray-100 rounded-2xl p-4">
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className={`text-2xl font-semibold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-50 p-1 rounded-xl mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-1 justify-center ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {loading ? <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Chargement…</div> : (
        <>
          {tab === 'acquisition' && <AcquisitionTab prospects={prospects} />}
          {tab === 'prospects'   && <ProspectsTab prospects={prospects} onRefresh={loadAll} onToast={showToast} />}
          {tab === 'campagnes'   && <CampagnesTab campagnes={campagnes} prospects={prospects} onRefresh={loadAll} onToast={showToast} />}
          {tab === 'social'      && <SocialTab onToast={showToast} />}
          {tab === 'satisfaction'&& <SatisfactionTab data={satisfaction} prospects={prospects} onRefresh={loadAll} onToast={showToast} />}
        </>
      )}
    </div>
  )
}

// ─── Onglet Acquisition ───────────────────────────────────────────────────────
function AcquisitionTab({ prospects }: { prospects: Prospect[] }) {
  const bySource = SOURCES.reduce((acc, s) => {
    acc[s] = prospects.filter(p => p.source === s).length; return acc
  }, {} as Record<string, number>)
  const byStatut = STATUTS.reduce((acc, s) => {
    acc[s] = prospects.filter(p => p.statut === s).length; return acc
  }, {} as Record<string, number>)
  const total = prospects.length || 1
  const conversionRate = prospects.length > 0 ? Math.round(byStatut['inscrit'] / prospects.length * 100) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sources */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Sources d'acquisition</h3>
          <div className="space-y-3">
            {SOURCES.filter(s => bySource[s] > 0).sort((a,b) => bySource[b]-bySource[a]).map(s => (
              <div key={s}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2">{sourceIcon[s]} <span className="capitalize">{s.replace('_',' ')}</span></span>
                  <span className="font-medium text-gray-900">{bySource[s]}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#BE185D] rounded-full transition-all" style={{ width: `${bySource[s]/total*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Tunnel de conversion</h3>
          <div className="space-y-3">
            {STATUTS.map((s, i) => {
              const colors = ['bg-blue-500','bg-amber-500','bg-green-500','bg-gray-400']
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="capitalize">{s}</span>
                    <span className="font-medium">{byStatut[s]} <span className="text-gray-400 font-normal">({Math.round(byStatut[s]/total*100)}%)</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[i]} rounded-full`} style={{ width: `${byStatut[s]/total*100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-50 text-center">
            <div className="text-2xl font-semibold text-green-600">{conversionRate}%</div>
            <div className="text-xs text-gray-400">taux de conversion global</div>
          </div>
        </div>
      </div>

      {/* Par métier */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Répartition par métier</h3>
        <div className="flex flex-wrap gap-3">
          {METIERS.map(m => {
            const n = prospects.filter(p => p.metier === m).length
            if (!n) return null
            return (
              <div key={m} className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
                <span className="text-sm font-medium text-gray-900 capitalize">{m}</span>
                <span className="text-xs bg-[#BE185D] text-white rounded-full px-2 py-0.5 font-medium">{n}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Onglet Prospects ─────────────────────────────────────────────────────────
function ProspectsTab({ prospects, onRefresh, onToast }: { prospects: Prospect[]; onRefresh: () => void; onToast: (m: string) => void }) {
  const [filter, setFilter] = useState({ statut: '', source: '', metier: '', q: '' })
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', metier: '', source: 'manuel', statut: 'nouveau', formation_interesse: '', notes: '' })

  const filtered = prospects.filter(p =>
    (!filter.statut || p.statut === filter.statut) &&
    (!filter.source || p.source === filter.source) &&
    (!filter.metier || p.metier === filter.metier) &&
    (!filter.q || `${p.nom} ${p.prenom} ${p.email}`.toLowerCase().includes(filter.q.toLowerCase()))
  )

  async function updateStatut(id: string, statut: string) {
    await fetch('/api/prospects', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, statut }) })
    onRefresh(); onToast(`Statut mis à jour → ${statut}`)
  }

  async function addProspect() {
    setSaving(true)
    const r = await fetch('/api/prospects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (r.ok) { onToast('Prospect ajouté ✓'); setShowAdd(false); onRefresh() }
    else { const e = await r.json(); onToast(e.error ?? 'Erreur') }
    setSaving(false)
  }

  async function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const text = await file.text()
    const lines = text.split('\n').filter(Boolean)
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const rows = lines.slice(1).map(l => {
      const vals = l.split(',')
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = vals[i]?.trim() ?? '' })
      return obj
    }).filter(r => r.email)
    const r = await fetch('/api/prospects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rows) })
    const d = await r.json()
    onToast(`${d.count ?? 0} prospects importés ✓`); onRefresh()
  }

  return (
    <div className="space-y-4">
      {/* Barre d'actions */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <input value={filter.q} onChange={e => setFilter(f => ({ ...f, q: e.target.value }))} placeholder="Rechercher…" className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30 w-48" />
          <select value={filter.statut} onChange={e => setFilter(f => ({ ...f, statut: e.target.value }))} className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none">
            <option value="">Tous statuts</option>
            {STATUTS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
          <select value={filter.source} onChange={e => setFilter(f => ({ ...f, source: e.target.value }))} className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none">
            <option value="">Toutes sources</option>
            {SOURCES.map(s => <option key={s} value={s}>{sourceIcon[s]} {s.replace('_',' ')}</option>)}
          </select>
          <select value={filter.metier} onChange={e => setFilter(f => ({ ...f, metier: e.target.value }))} className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none">
            <option value="">Tous métiers</option>
            {METIERS.map(m => <option key={m} value={m} className="capitalize">{m}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
          <button onClick={() => fileRef.current?.click()} className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">📊 Import CSV</button>
          <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-[#BE185D] text-white rounded-xl text-sm font-medium hover:bg-[#9d1550] transition-colors">+ Ajouter</button>
        </div>
      </div>

      {/* Liste */}
      <div className="text-xs text-gray-400 mb-2">{filtered.length} prospect{filtered.length > 1 ? 's' : ''}</div>
      <div className="space-y-2">
        {filtered.map(p => (
          <div key={p.id} className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-[#fdf2f8] flex items-center justify-center text-[#BE185D] font-semibold text-sm flex-shrink-0">
              {(p.prenom?.[0] ?? p.nom[0]).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-sm">{p.prenom} {p.nom}</div>
              <div className="text-xs text-gray-400 truncate">{p.email} {p.formation_interesse ? `· Intéressé par : ${p.formation_interesse}` : ''}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {p.source && <span className="text-lg">{sourceIcon[p.source]}</span>}
              {p.metier && <span className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg capitalize">{p.metier}</span>}
              <select value={p.statut} onChange={e => updateStatut(p.id, e.target.value)} className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${statutColors[p.statut]}`}>
                {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">Aucun prospect trouvé</div>}
      </div>

      {/* Modal ajout */}
      {showAdd && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Nouveau prospect</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[['Prénom','prenom','Maud'],['Nom *','nom','Batellier']].map(([l,k,ph]) => (
                  <div key={k}><label className="text-xs font-medium text-gray-600 block mb-1">{l}</label>
                  <input className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30" value={(form as Record<string,string>)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={ph} /></div>
                ))}
              </div>
              {[['Email *','email','maud@studio.fr'],['Téléphone','telephone','06 12 34 56 78'],['Formation intéressée','formation_interesse','Colorimétrie ICC']].map(([l,k,ph]) => (
                <div key={k}><label className="text-xs font-medium text-gray-600 block mb-1">{l}</label>
                <input className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30" value={(form as Record<string,string>)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} placeholder={ph} /></div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                {([['Métier','metier',METIERS],['Source','source',SOURCES]] as [string,string,string[]][]).map(([l,k,opts]) => (
                  <div key={k}><label className="text-xs font-medium text-gray-600 block mb-1">{l}</label>
                  <select className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none" value={(form as Record<string,string>)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}>
                    <option value="">—</option>{opts.map(o => <option key={o} value={o} className="capitalize">{o}</option>)}
                  </select></div>
                ))}
              </div>
              <div><label className="text-xs font-medium text-gray-600 block mb-1">Notes</label>
              <textarea rows={2} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30 resize-none" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Annuler</button>
              <button onClick={addProspect} disabled={saving || !form.nom || !form.email} className="flex-1 py-2.5 bg-[#BE185D] text-white rounded-xl text-sm font-medium disabled:opacity-40">{saving ? 'Ajout…' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Onglet Campagnes Brevo ───────────────────────────────────────────────────
function CampagnesTab({ campagnes, prospects, onRefresh, onToast }: { campagnes: Campagne[]; prospects: Prospect[]; onRefresh: () => void; onToast: (m: string) => void }) {
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ nom: '', canal: 'brevo', sujet: '', contenu: '', cible_metier: [] as string[], cible_source: [] as string[], scheduled_at: '' })

  const preview = prospects.filter(p =>
    (form.cible_metier.length === 0 || form.cible_metier.includes(p.metier ?? '')) &&
    (form.cible_source.length === 0 || form.cible_source.includes(p.source ?? '')) &&
    p.statut !== 'inscrit'
  ).length

  function toggleArr(arr: string[], val: string) { return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }

  async function send() {
    setSaving(true)
    const r = await fetch('/api/campagnes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const d = await r.json()
    if (r.ok) { onToast(`Campagne créée — ${d.nb_destinataires} destinataires ✓`); setShowNew(false); onRefresh() }
    else onToast(d.error ?? 'Erreur')
    setSaving(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-400">{campagnes.length} campagne{campagnes.length > 1 ? 's' : ''}</div>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 bg-[#BE185D] text-white rounded-xl text-sm font-medium hover:bg-[#9d1550] transition-colors">+ Nouvelle campagne</button>
      </div>

      <div className="space-y-3">
        {campagnes.map(c => (
          <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-gray-900 text-sm">{c.nom}</div>
                {c.sujet && <div className="text-xs text-gray-400 mt-0.5">{c.sujet}</div>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${canalColors[c.canal] ?? 'bg-gray-50 text-gray-600'}`}>{c.canal}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.statut === 'envoyée' ? 'bg-green-50 text-green-700' : c.statut === 'planifiée' ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'}`}>{c.statut}</span>
              </div>
            </div>
            {c.statut === 'envoyée' && (
              <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-50">
                {[['📨','Envoyés',c.nb_destinataires],['👁','Ouvertures',c.nb_ouvertures],['🖱','Clics',c.nb_clics],['✅','Conversions',c.nb_conversions]].map(([icon,label,val]) => (
                  <div key={String(label)} className="text-center">
                    <div className="text-lg">{icon}</div>
                    <div className="text-sm font-semibold text-gray-900">{val}</div>
                    <div className="text-xs text-gray-400">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {campagnes.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">Aucune campagne créée</div>}
      </div>

      {showNew && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Nouvelle campagne</h3>
              <button onClick={() => setShowNew(false)} className="text-gray-400 text-xl">×</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div><label className="text-xs font-medium text-gray-600 block mb-1.5">Nom de la campagne</label>
              <input className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Formation Colorimétrie — Juin 2026" /></div>
              <div><label className="text-xs font-medium text-gray-600 block mb-1.5">Canal</label>
              <div className="flex gap-2 flex-wrap">
                {CANAUX.map(c => <button key={c} onClick={() => setForm(f => ({ ...f, canal: c }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.canal === c ? 'bg-[#BE185D] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>{c}</button>)}
              </div></div>
              {form.canal === 'brevo' && (
                <><div><label className="text-xs font-medium text-gray-600 block mb-1.5">Sujet email</label>
                <input className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30" value={form.sujet} onChange={e => setForm(f => ({ ...f, sujet: e.target.value }))} placeholder="Découvrez notre formation Colorimétrie ICC…" /></div>
                <div><label className="text-xs font-medium text-gray-600 block mb-1.5">Contenu HTML</label>
                <textarea rows={5} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30 resize-none font-mono" value={form.contenu} onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))} placeholder="<p>Bonjour,</p><p>Nous vous invitons à découvrir…</p>" /></div></>
              )}
              {(form.canal === 'instagram' || form.canal === 'linkedin' || form.canal === 'facebook') && (
                <div><label className="text-xs font-medium text-gray-600 block mb-1.5">Texte du post</label>
                <textarea rows={5} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30 resize-none" value={form.contenu} onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))} placeholder="🎨 Nouvelle session de formation disponible…" /></div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Cibler par métier <span className="text-gray-400 font-normal">(vide = tous)</span></label>
                <div className="flex flex-wrap gap-2">
                  {METIERS.map(m => <button key={m} onClick={() => setForm(f => ({ ...f, cible_metier: toggleArr(f.cible_metier, m) }))} className={`px-3 py-1 rounded-lg text-xs capitalize transition-colors ${form.cible_metier.includes(m) ? 'bg-[#BE185D] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>{m}</button>)}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Cibler par source <span className="text-gray-400 font-normal">(vide = toutes)</span></label>
                <div className="flex flex-wrap gap-2">
                  {SOURCES.map(s => <button key={s} onClick={() => setForm(f => ({ ...f, cible_source: toggleArr(f.cible_source, s) }))} className={`px-3 py-1 rounded-lg text-xs transition-colors ${form.cible_source.includes(s) ? 'bg-[#BE185D] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>{sourceIcon[s]} {s.replace('_',' ')}</button>)}
                </div>
              </div>
              <div className="bg-[#fdf2f8] rounded-xl px-4 py-3 text-sm text-[#BE185D] font-medium">
                👥 {preview} prospect{preview > 1 ? 's' : ''} ciblé{preview > 1 ? 's' : ''}
              </div>
              <div><label className="text-xs font-medium text-gray-600 block mb-1.5">Planifier (optionnel)</label>
              <input type="datetime-local" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} /></div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Annuler</button>
              <button onClick={send} disabled={saving || !form.nom} className="flex-1 py-2.5 bg-[#BE185D] text-white rounded-xl text-sm font-medium disabled:opacity-40">{saving ? 'Création…' : form.scheduled_at ? '📅 Planifier' : '🚀 Créer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Onglet Réseaux sociaux ───────────────────────────────────────────────────
function SocialTab({ onToast }: { onToast: (m: string) => void }) {
  const [reseau, setReseau] = useState<'instagram'|'linkedin'|'facebook'>('instagram')
  const [contenu, setContenu] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [scheduled, setScheduled] = useState('')
  const [generating, setGenerating] = useState(false)

  const reseaux = [
    { id: 'instagram', icon: '📸', label: 'Instagram', limit: 2200, tip: 'Privilégiez les visuels et les hashtags' },
    { id: 'linkedin',  icon: '💼', label: 'LinkedIn',  limit: 3000, tip: 'Ton professionnel, insights métier' },
    { id: 'facebook',  icon: '👥', label: 'Facebook',  limit: 63206, tip: 'Plus conversationnel, appel à l'action' },
  ]
  const current = reseaux.find(r => r.id === reseau)!

  async function generateWithAI() {
    setGenerating(true)
    try {
      const r = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Génère un post ${reseau} pour Color Aim, organisme de formation en arts graphiques et colorimétrie. Le post doit promouvoir nos formations (colorimétrie ICC, photographie, impression). Ton professionnel et engageant. Maximum ${current.limit} caractères. Inclus des emojis pertinents. Ajoute 5-8 hashtags pertinents séparés par des virgules.`,
        }),
      })
      const d = await r.json()
      if (d.reponse) {
        const parts = d.reponse.split('Hashtags:')
        setContenu(parts[0]?.trim() ?? d.reponse)
        if (parts[1]) setHashtags(parts[1].trim())
      }
    } catch { onToast('Erreur génération IA') }
    setGenerating(false)
  }

  return (
    <div className="space-y-5">
      {/* Choix réseau */}
      <div className="grid grid-cols-3 gap-3">
        {reseaux.map(r => (
          <button key={r.id} onClick={() => setReseau(r.id as typeof reseau)}
            className={`p-4 rounded-2xl border-2 text-center transition-all ${reseau === r.id ? 'border-[#BE185D] bg-[#fdf2f8]' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
            <div className="text-2xl mb-1">{r.icon}</div>
            <div className={`text-sm font-medium ${reseau === r.id ? 'text-[#BE185D]' : 'text-gray-700'}`}>{r.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{r.limit.toLocaleString()} car. max</div>
          </button>
        ))}
      </div>

      <div className="bg-[#fdf2f8] rounded-xl px-4 py-2.5 text-xs text-[#BE185D]">💡 {current.tip}</div>

      {/* Éditeur */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Contenu du post</label>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${contenu.length > current.limit ? 'text-red-500' : 'text-gray-400'}`}>{contenu.length}/{current.limit}</span>
            <button onClick={generateWithAI} disabled={generating} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-40">
              {generating ? '⏳ Génération…' : '✨ Générer avec IA'}
            </button>
          </div>
        </div>
        <textarea
          rows={6}
          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30 resize-none"
          placeholder={`Rédigez votre post ${reseau}…`}
          value={contenu}
          onChange={e => setContenu(e.target.value)}
        />
        {reseau === 'instagram' && (
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">Hashtags</label>
            <input className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30" value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#colorimetrie #graphisme #formation #coloraim" />
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1.5">Planifier la publication</label>
          <input type="datetime-local" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#BE185D]/30" value={scheduled} onChange={e => setScheduled(e.target.value)} />
        </div>

        {/* Aperçu */}
        {contenu && (
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
            <div className="text-xs font-medium text-gray-400 mb-2">Aperçu {reseau}</div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#BE185D] flex items-center justify-center text-white text-xs font-bold">CA</div>
              <div><div className="text-xs font-semibold text-gray-900">Color Aim</div><div className="text-xs text-gray-400">@coloraim.fr</div></div>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{contenu}</p>
            {hashtags && <p className="text-sm text-blue-500 mt-2">{hashtags}</p>}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={() => { setContenu(''); setHashtags(''); setScheduled('') }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Effacer</button>
          <button
            onClick={() => onToast(scheduled ? `Post planifié pour le ${new Date(scheduled).toLocaleDateString('fr-FR')} ✓` : 'Post copié dans le presse-papier — collez-le dans ' + reseau)}
            disabled={!contenu}
            className="flex-1 py-2.5 bg-[#BE185D] text-white rounded-xl text-sm font-medium hover:bg-[#9d1550] disabled:opacity-40"
          >
            {scheduled ? '📅 Planifier' : '📋 Copier & publier'}
          </button>
        </div>
      </div>

      {/* Note API */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
        ⚠️ La publication automatique sur Instagram, LinkedIn et Facebook nécessite les clés API de chaque réseau (Meta Business API, LinkedIn API). En attendant, le bouton copie le contenu pour une publication manuelle.
      </div>
    </div>
  )
}

// ─── Onglet Satisfaction ──────────────────────────────────────────────────────
function SatisfactionTab({ data, prospects, onRefresh, onToast }: { data: StatSatisfaction | null; prospects: Prospect[]; onRefresh: () => void; onToast: (m: string) => void }) {
  const [sending, setSending] = useState<string | null>(null)

  const inscrits = prospects.filter(p => p.statut === 'inscrit')
  const questionnaires = data?.questionnaires ?? []
  const repondus = questionnaires.filter(q => q.repondu_at)

  async function sendQuestionnaire(prospect: Prospect) {
    setSending(prospect.id)
    try {
      const r = await fetch('/api/satisfaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidat_email: prospect.email, candidat_nom: `${prospect.prenom ?? ''} ${prospect.nom}`.trim() }),
      })
      if (r.ok) { onToast(`Questionnaire envoyé à ${prospect.nom} ✓`); onRefresh() }
      else onToast('Erreur envoi')
    } catch { onToast('Erreur réseau') }
    setSending(null)
  }

  const npsColor = (nps: number | null) => {
    if (!nps) return 'text-gray-400'
    if (nps >= 8) return 'text-green-600'
    if (nps >= 6) return 'text-amber-600'
    return 'text-red-500'
  }

  return (
    <div className="space-y-5">
      {/* KPIs satisfaction */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
          <div className={`text-3xl font-semibold ${npsColor(data?.nps ?? null)}`}>{data?.nps ?? '—'}<span className="text-lg text-gray-400">/10</span></div>
          <div className="text-xs text-gray-400 mt-1">Score NPS moyen</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
          <div className="text-3xl font-semibold text-[#BE185D]">{data?.repondus ?? 0}</div>
          <div className="text-xs text-gray-400 mt-1">Réponses reçues</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-5 text-center">
          <div className="text-3xl font-semibold text-blue-600">
            {data?.total ? Math.round((data.repondus / data.total) * 100) : 0}%
          </div>
          <div className="text-xs text-gray-400 mt-1">Taux de réponse</div>
        </div>
      </div>

      {/* Envoyer questionnaires */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h3 className="font-semibold text-gray-900 mb-1">Envoyer un questionnaire</h3>
        <p className="text-xs text-gray-400 mb-4">Envoi automatique via Brevo aux inscrits</p>
        {inscrits.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucun inscrit pour l'instant</p>
        ) : (
          <div className="space-y-2">
            {inscrits.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm font-medium text-gray-900">{p.prenom} {p.nom}</div>
                  <div className="text-xs text-gray-400">{p.email}</div>
                </div>
                <button onClick={() => sendQuestionnaire(p)} disabled={sending === p.id} className="px-3 py-1.5 bg-[#BE185D] text-white rounded-lg text-xs font-medium hover:bg-[#9d1550] disabled:opacity-40 transition-colors">
                  {sending === p.id ? '⏳' : '✉ Envoyer'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Réponses reçues */}
      {repondus.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Dernières réponses</h3>
          <div className="space-y-3">
            {repondus.map((q, i) => (
              <div key={i} className="border border-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-900">{q.candidats?.prenom} {q.candidats?.nom}</div>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <div key={j} className={`w-2 h-4 rounded-sm ${j < (q.note_globale ?? 0) ? 'bg-[#BE185D]' : 'bg-gray-100'}`} />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">{q.note_globale}/10</span>
                  </div>
                </div>
                {q.formations && <div className="text-xs text-gray-400">{q.formations.titre}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
