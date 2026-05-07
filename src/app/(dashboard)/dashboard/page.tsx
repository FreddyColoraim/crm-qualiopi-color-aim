export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">
          Prochain audit Qualiopi : <span className="font-medium text-pink-700">15/11/2026</span>
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl mb-2">📚</div>
          <div className="text-2xl font-semibold text-pink-700">6</div>
          <div className="text-sm text-gray-500 mt-0.5">Formations actives</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl mb-2">👤</div>
          <div className="text-2xl font-semibold text-blue-600">0</div>
          <div className="text-sm text-gray-500 mt-0.5">Candidats inscrits</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-2xl font-semibold text-green-600">0</div>
          <div className="text-sm text-gray-500 mt-0.5">Inscriptions validées</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-2xl mb-2">🏆</div>
          <div className="text-2xl font-semibold text-amber-600">95%</div>
          <div className="text-sm text-gray-500 mt-0.5">Score Qualiopi</div>
        </div>
      </div>
    </div>
  )
}