export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Portfolio Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome to your portfolio dashboard!</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Total Value</h3>
          <p className="text-3xl font-bold text-blue-600">$125,420</p>
          <p className="text-sm text-blue-600">+7.2% overall</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Portfolios</h3>
          <p className="text-3xl font-bold text-green-600">3</p>
          <p className="text-sm text-green-600">Active portfolios</p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-purple-800">Performance</h3>
          <p className="text-3xl font-bold text-purple-600">+$8,420</p>
          <p className="text-sm text-purple-600">Total gains</p>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>Bought AAPL - 10 shares</span>
            <span className="text-green-600">+$1,502.50</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>Sold MSFT - 5 shares</span>
            <span className="text-red-600">-$2,104.00</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
            <span>Bought BTC - 0.1 BTC</span>
            <span className="text-green-600">+$4,250.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
