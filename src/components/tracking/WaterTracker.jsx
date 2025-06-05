import { useState } from 'react';
import { Droplets, Plus, Minus } from 'lucide-react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';

const WaterTracker = ({ currentIntake = 0, goal = 4000, onUpdate }) => {
  const [showControls, setShowControls] = useState(false);
  
  const addWater = (amount) => {
    const newIntake = currentIntake + amount;
    onUpdate(newIntake);
    
    if (newIntake >= goal && currentIntake < goal) {
      toast.success('🎉 Daily water goal achieved!');
    }
  };

  const subtractWater = (amount) => {
    const newIntake = Math.max(0, currentIntake - amount);
    onUpdate(newIntake);
  };

  const progressPercentage = Math.min((currentIntake / goal) * 100, 100);

  const waterAmounts = [250, 500, 750, 1000]; // ml

  return (
    <div className="relative">
      <button
        onClick={() => setShowControls(!showControls)}
        className="w-full btn-secondary flex items-center justify-center"
      >
        <Droplets className="h-4 w-4 mr-2" />
        Add Water
      </button>

      {showControls && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Water Intake</span>
              <span className="text-sm text-gray-600">
                {currentIntake} ml / {goal} ml
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            
            <div className="text-xs text-gray-500 text-center">
              {progressPercentage.toFixed(1)}% of daily goal
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="space-y-2 mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Quick Add:</div>
            <div className="grid grid-cols-2 gap-2">
              {waterAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => addWater(amount)}
                  className="flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {amount} ml
                </button>
              ))}
            </div>
          </div>

          {/* Manual Controls */}
          <div className="flex items-center justify-between border-t pt-3">
            <button
              onClick={() => subtractWater(250)}
              disabled={currentIntake === 0}
              className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="h-4 w-4 mr-1" />
              250ml
            </button>
            
            <div className="text-sm text-gray-600">
              {goal - currentIntake > 0 ? `${goal - currentIntake} ml to go` : 'Goal achieved!'}
            </div>
            
            <button
              onClick={() => setShowControls(false)}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

WaterTracker.propTypes = {
  currentIntake: PropTypes.number,
  goal: PropTypes.number,
  onUpdate: PropTypes.func.isRequired
};

export default WaterTracker; 