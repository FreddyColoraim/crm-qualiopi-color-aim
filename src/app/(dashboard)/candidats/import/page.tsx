'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Row {
  nom: string; prenom: string; email: string
  telephone?: string; entreprise?: string; financeur?: string
  poste?: string; metier?: string; notes?: string
  _valid: boolean; _error?: string
}

const COLONNES = ['nom','prenom','email','telephone','entreprise','financeur','poste','metier','notes']
const FINANCEURS = ['AFDAS','FAFCEA',"L'Opcommerce",'OPCO 2i','CPF','Autre']

export default function ImportPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [step, setStep] = useState<'upload'|'preview'|'done'>('upload')
  const [result, setResult] = useState<{ importes: number; erreurs: number; details: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function parseCSV(text: string): Row[] {
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ''))
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = vals[i] ?? '' })
      const row: Row = {
        nom:        obj.nom ?? obj.name ?? '',
        prenom:     obj.prenom ?? obj.firstname ?? obj.prénom ?? '',
        email:      obj.email ?? obj.mail ?? '',
        telephone:  obj.telephone ?? obj.tel ?? obj.phone ?? '',
        entreprise: obj.entreprise ?? obj.company ?? obj.société ?? '',
        financeur:  obj.financeur ?? obj.opco ?? obj.financement ?? '',
        poste:      obj.poste ?? obj.job ?? obj.fonction ?? '',
        metier:     obj.metier ?? obj.métier ?? '',
        notes:      obj.notes ?? obj.commentaire ?? '',
        _valid: true,
      }
      if (!row.nom) { row._valid = false; row._error = 'Nom manquant' }
      if (!row.email || !row.email.includes('@')) { row._valid = false; row._error = 'Email invalide' }
      return row
    })
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file, 'UTF-8')
  }

  function downloadTemplate() {
    const csv = 'nom,prenom,email,telephone,entreprise,financeur,poste,metier,notes\nDupont,Marie,marie.dupont@studio.fr,06 12 34 56 78,Studio Dupont,AFDAS,Directrice artistique,graphiste,Intéressée colorimétrie'
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'template_candidats.csv'; a.click()
  }

  async function handleImport() {
    setLoading(true)
    const validRows = rows.filter(r => r._valid)
    const res = await fetch('/api/candidats/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: validRows }),
    })
    const data = await res.json()
    setResult(data)
    setStep('done')
    setLoading(false)
  }

  const valid = rows.filter(r => r._valid)
  const invalid = rows.filter(r => !r._valid)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.push('/candidats')} className="text-sm text-gray-400 hover:text-[#BE185D] mb-3 flex items-center gap-1">← Retour aux candidats</button>
        <h1 className="text-2xl font-semibold text-gray-900">Import CSV</h1>
        <p className="text-sm text-gray-500 mt-1">Importez une liste de candidats depuis un fichier CSV</p>
      </div>

      {step === 'upload' && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">📊</div>
            <h2 className="font-semibold text-gray-900 mb-2">Sélectionner un fichier CSV</h2>
            <p className="text-sm text-gray-400 mb-6">Colonnes acceptées : nom, prenom, email, telephone, entreprise, financeur, poste, metier, notes</p>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            <div className="flex gap-3 justify-center">
              <button onClick={downloadTemplate} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">⬇ Template CSV</button>
              <button onClick={() => fileRef.current?.click()} className="px-4 py-2.5 bg-[#BE185D] text-white rounded-xl text-sm font-medium hover:bg-[#9d1550] transition-colors">Choisir un fichier</button>
            </div>
          </div>
          <div className="bg-[#fdf2f8] rounded-xl p-4 text-xs text-[#BE185D]">
            <strong>Format attendu :</strong> UTF-8, séparateur virgule, première ligne = en-têtes.<br/>
            Les doublons (même email) seront mis à jour automatiquement.
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
              <div className="text-2xl font-semibold text-gray-900">{rows.length}</div>
              <div className="text-xs text-gray-400 mt-1">Lignes détectées</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
              <div className="text-2xl font-semibold text-green-600">{valid.length}</div>
              <div className="text-xs text-gray-400 mt-1">Prêts à importer</div>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center">
              <div className="text-2xl font-semibold text-red-500">{invalid.length}</div>
              <div className="text-xs text-gray-400 mt-1">Erreurs</div>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50 text-xs font-medium text-gray-400 uppercase tracking-wider">Aperçu — {rows.length} lignes</div>
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {rows.map((r, i) => (
                <div key={i} className={`flex items-center gap-4 px-5 py-3 ${!r._valid ? 'bg-red-50' : ''}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${r._valid ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{r.prenom} {r.nom}</div>
                    <div className="text-xs text-gray-400 truncate">{r.email} {r.entreprise ? `· ${r.entreprise}` : ''} {r.financeur ? `· ${r.financeur}` : ''}</div>
                    {!r._valid && <div className="text-xs text-red-500 mt-0.5">{r._error}</div>}
                  </div>
                  {r.metier && <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full capitalize">{r.metier}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setRows([]); setStep('upload'); if(fileRef.current) fileRef.current.value = '' }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Changer de fichier</button>
            <button onClick={handleImport} disabled={loading || valid.length === 0} className="flex-1 py-2.5 bg-[#BE185D] text-white rounded-xl text-sm font-medium hover:bg-[#9d1550] disabled:opacity-40">
              {loading ? 'Import en cours…' : `Importer ${valid.length} candidat${valid.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">{result.erreurs === 0 ? '🎉' : '⚠️'}</div>
            <h2 className="font-semibold text-gray-900 mb-2">Import terminé</h2>
            <div className="flex gap-8 justify-center mt-4">
              <div><div className="text-2xl font-semibold text-green-600">{result.importes}</div><div className="text-xs text-gray-400">importés</div></div>
              {result.erreurs > 0 && <div><div className="text-2xl font-semibold text-red-500">{result.erreurs}</div><div className="text-xs text-gray-400">erreurs</div></div>}
            </div>
            {result.details.length > 0 && (
              <div className="mt-4 text-left bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
                {result.details.map((d, i) => <div key={i}>{d}</div>)}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setRows([]); setResult(null); setStep('upload') }} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">Nouvel import</button>
            <button onClick={() => router.push('/candidats')} className="flex-1 py-2.5 bg-[#BE185D] text-white rounded-xl text-sm font-medium hover:bg-[#9d1550]">Voir les candidats →</button>
          </div>
        </div>
      )}
    </div>
  )
}
