// components/StatCard.jsx
export default function StatCard({ title, value, change, icon: Icon, iconBg, iconColor }) {
  console.log("📊 StatCard rendering:", title, value); // Debug line
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 lg:p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
          change.startsWith('+') 
            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        }`}>
          {change}
        </span>
      </div>
      <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}