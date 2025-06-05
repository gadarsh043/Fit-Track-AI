import { Doughnut } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const MacroChart = ({ data }) => {
  // Calculate total macros from meals
  const calculateMacros = (meals) => {
    if (!meals || meals.length === 0) {
      return { protein: 0, carbs: 0, fats: 0, calories: 0 };
    }

    return meals.reduce((totals, meal) => {
      return {
        protein: totals.protein + (meal.protein || 0),
        carbs: totals.carbs + (meal.carbs || 0),
        fats: totals.fats + (meal.fats || 0),
        calories: totals.calories + (meal.calories || 0)
      };
    }, { protein: 0, carbs: 0, fats: 0, calories: 0 });
  };

  const macros = calculateMacros(data);

  // Show empty state for new users instead of dummy data
  if (!data || data.length === 0 || macros.calories === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium">No meals logged yet</p>
          <p className="text-sm">Start logging your meals to see macro breakdown</p>
        </div>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
          color: '#374151',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#3b82f6',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value}g (${percentage}%)`;
          }
        }
      },
    },
    cutout: '60%',
  };

  const chartData = {
    labels: ['Protein', 'Carbohydrates', 'Fats'],
    datasets: [
      {
        data: [macros.protein, macros.carbs, macros.fats],
        backgroundColor: [
          '#ef4444', // Red for protein
          '#3b82f6', // Blue for carbs
          '#eab308', // Yellow for fats
        ],
        borderColor: [
          '#dc2626',
          '#2563eb',
          '#ca8a04',
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          '#f87171',
          '#60a5fa',
          '#fbbf24',
        ],
        hoverBorderWidth: 3,
      },
    ],
  };

  const totalMacroCalories = macros.protein * 4 + macros.carbs * 4 + macros.fats * 9;

  return (
    <div className="h-64 relative">
      <Doughnut data={chartData} options={options} />
      
      {/* Center text showing total calories */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {macros.calories || totalMacroCalories}
          </div>
          <div className="text-sm text-gray-500">calories</div>
        </div>
      </div>

      {/* Macro breakdown */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-red-600">{macros.protein}g</div>
          <div className="text-xs text-gray-500">Protein</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-blue-600">{macros.carbs}g</div>
          <div className="text-xs text-gray-500">Carbs</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-yellow-600">{macros.fats}g</div>
          <div className="text-xs text-gray-500">Fats</div>
        </div>
      </div>
    </div>
  );
};

MacroChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default MacroChart; 