import { createClient } from '@/lib/supabase/server'
import { Newspaper, Pin, ExternalLink, AlertTriangle, Info, TrendingUp, FileCheck, RefreshCw, Euro, Lightbulb } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Actualite {
  id: string
  titre: string
  description: string
  categorie: string
  niveau_impact: string
  source: string | null
  url_source: string | null
  date_publication: string | null
  epinglee: boolean
  statut: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d: string | null) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function categorieConfig(cat: string): { icon: React.ReactNode; bg: string; text: string; border: string } {
  const map: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string }> = {
    'Réglementation': { icon: <FileCheck className="w-3.5 h-3.5" />,    bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
    'Financement':    { icon: <Euro className="w-3.5 h-3.5" />,          bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
    'Certification':  { icon: <FileCheck className="w-3.5 h-3.5" />,    bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
    'Réforme':        { icon: <RefreshCw className="w-3.5 h-3.5" />,    bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
    'CPF':            { icon: <TrendingUp className="w-3.5 h-3.5" />,   bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'Opportunité':    { icon: <Lightbulb className="w-3.5 h-3.5" />,    bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  }
  return map[cat] ?? { icon: <Info className="w-3.5 h-3.5" />, bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' }
}

function impactConfig(niveau: string): { label: string; cls: string; icon: React.ReactNode } {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    'élevé': { label: 'Impact élevé', cls: 'bg-red-50 text-red-700 border-red-200',       icon: <AlertTriangle className="w-3 h-3" /> },
    'moyen': { label: 'Impact moyen', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Info className="w-3 h-3" /> },
    'faible':{ label: 'Impact faible', cls: 'bg-gray-50 text-gray-500 border-gray-200',   icon: <Info className="w-3 h-3" /> },
  }
  return map[niveau] ?? map['moyen']
}

// ─── Carte actualité ─────────────────────────────────────────────────────────
function CarteActualite({ a }: { a: Actualite }) {
  const cat = categorieConfig(a.categorie)
  const impact = impactConfig(a.niveau_impact)

  return (
    <article className={`bg-white border rounded-2xl overflow-hidden transition-shadow hover:shadow-md ${a.epinglee ? 'border-[#A0195B]' : 'border-gray-200'}`}>
      {/* Barre top épinglée */}
      {a.epinglee && <div className="h-1 bg-[#A0195B]" />}

      <div className="p-5">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {a.epinglee && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#A0195B] bg-[#FEE7F0] px-2 py-0.5 rounded-full">
              <Pin className="w-3 h-3" />
              Épinglée
            </span>
          )}
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
            {cat.icon}
            {a.categorie}
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${impact.cls}`}>
            {impact.icon}
            {impact.label}
          </span>
        </div>

        {/* Titre */}
        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-2">
          {a.titre}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {a.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-400">
            {a.source && <span className="font-medium text-gray-500">{a.source}</span>}
            {a.date_publication && (
              <span> · {formatDate(a.date_publication)}</span>
            )}
          </div>
          {a.url_source && (
            <a
              href={a.url_source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#A0195B] hover:underline flex-shrink-0"
            >
              Lire la source
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function VeillePage() {
  const supabase = await createClient()

  const { data: actualites } = await supabase
    .from('veille_actualites')
    .select('*')
    .eq('statut', 'active')
    .order('epinglee', { ascending: false })
    .order('date_publication', { ascending: false })

  const liste = (actualites ?? []) as Actualite[]
  const epinglees = liste.filter(a => a.epinglee)
  const autres = liste.filter(a => !a.epinglee)

  // Stats par impact
  const nbEleve = liste.filter(a => a.niveau_impact === 'élevé').length
  const nbMoyen = liste.filter(a => a.niveau_impact === 'moyen').length

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-[#A0195B]" />
            Veille formation
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {liste.length} actualité{liste.length > 1 ? 's' : ''} · {nbEleve} impact élevé · {nbMoyen} impact moyen
          </p>
        </div>
      </div>

      {/* Alertes impact élevé */}
      {nbEleve > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3 mb-6">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">{nbEleve} actualité{nbEleve > 1 ? 's' : ''} à impact élevé</span>
            {' '}nécessite{nbEleve > 1 ? 'nt' : ''} votre attention avant le prochain audit.
          </p>
        </div>
      )}

      {/* Épinglées */}
      {epinglees.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5" />
            À ne pas manquer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {epinglees.map(a => <CarteActualite key={a.id} a={a} />)}
          </div>
        </section>
      )}

      {/* Autres actualités */}
      {autres.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Toutes les actualités
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {autres.map(a => <CarteActualite key={a.id} a={a} />)}
          </div>
        </section>
      )}

      {liste.length === 0 && (
        <div className="text-center py-20">
          <Newspaper className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">Aucune actualité disponible</p>
        </div>
      )}
    </div>
  )
}
