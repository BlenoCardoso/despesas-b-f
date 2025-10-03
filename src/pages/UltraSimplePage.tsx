export function MobileExpensesPage() {
  return (
    <div className="p-8 bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-blue-600 mb-4">🎉 Funcionou!</h1>
      <p className="text-lg text-gray-700 mb-4">Interface mobile carregando perfeitamente!</p>
      
      <div className="bg-green-100 p-4 rounded-lg border border-green-300">
        <h2 className="text-xl font-semibold text-green-800 mb-2">✅ Status do Sistema</h2>
        <ul className="text-green-700 space-y-1">
          <li>• React funcionando</li>
          <li>• Tailwind CSS ativo</li>
          <li>• Router funcionando</li>
          <li>• Componentes carregando</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-medium text-blue-800 mb-2">📱 Próximos Passos</h3>
        <p className="text-blue-700">
          Base funcionando! Agora podemos adicionar funcionalidades gradualmente.
        </p>
      </div>
    </div>
  )
}