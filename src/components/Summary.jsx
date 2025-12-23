// components/Summary.jsx
export default function SummaryCard({ title, count, color, onClick }) {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold group-hover:scale-110 transition-transform duration-300 p-4"
          style={{ background: color }}
        >
          {count}
        </div>
      </div>
      <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
        {count.toLocaleString()}
      </p>
    </div>
  );
}