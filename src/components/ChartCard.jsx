// components/ChartCard.jsx
export default function ChartCard({ title, children, action }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {action && (
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}