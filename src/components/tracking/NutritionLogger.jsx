import { useState } from 'react';
import { Plus, X, Apple, Clock, Zap } from 'lucide-react';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { commonFoods, mealTypes } from '../../constants/foodData';

const NutritionLogger = ({ meals = [], onUpdate }) => {
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Auto-fill nutrition when food is selected
  const handleFoodChange = (food) => {
    // Find the food in common foods
    for (const category of Object.values(commonFoods)) {
      if (category[food]) {
        const nutrition = category[food];
        setValue('protein', nutrition.protein);
        setValue('carbs', nutrition.carbs);
        setValue('fats', nutrition.fats);
        setValue('calories', nutrition.calories);
        break;
      }
    }
  };

  const addMeal = (data) => {
    const newMeal = {
      id: Date.now().toString(),
      food: data.food,
      quantity: parseFloat(data.quantity),
      unit: data.unit,
      mealType: data.mealType,
      protein: parseFloat(data.protein) || 0,
      carbs: parseFloat(data.carbs) || 0,
      fats: parseFloat(data.fats) || 0,
      calories: parseFloat(data.calories) || 0,
      notes: data.notes || '',
      completed: false,
      loggedAt: new Date().toISOString()
    };

    const updatedMeals = [...meals, newMeal];
    onUpdate(updatedMeals);
    reset();
    setIsAddingMeal(false);
    toast.success('Meal logged successfully!');
  };

  const removeMeal = (mealId) => {
    const updatedMeals = meals.filter(m => m.id !== mealId);
    onUpdate(updatedMeals);
    toast.success('Meal removed');
  };

  const completeMeal = (mealId) => {
    const updatedMeals = meals.map(m => 
      m.id === mealId 
        ? { ...m, completed: !m.completed, completedAt: new Date().toISOString() }
        : m
    );
    onUpdate(updatedMeals);
    toast.success('Meal marked as complete!');
  };

  // Calculate totals
  const totals = meals.reduce((acc, meal) => ({
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fats: acc.fats + meal.fats,
    calories: acc.calories + meal.calories
  }), { protein: 0, carbs: 0, fats: 0, calories: 0 });

  return (
    <div className="space-y-6">
      {/* Daily Nutrition Summary */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Daily Nutrition Summary
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{totals.protein.toFixed(1)}g</div>
            <div className="text-sm text-gray-600">Protein</div>
            <div className="text-xs text-gray-500">Goal: 150-160g</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totals.carbs.toFixed(1)}g</div>
            <div className="text-sm text-gray-600">Carbs</div>
            <div className="text-xs text-gray-500">Goal: 200-300g</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{totals.fats.toFixed(1)}g</div>
            <div className="text-sm text-gray-600">Fats</div>
            <div className="text-xs text-gray-500">Goal: 60-80g</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totals.calories.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Calories</div>
            <div className="text-xs text-gray-500">Goal: 2200-2500</div>
          </div>
        </div>
      </div>

      {/* Today's Meals */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <Apple className="h-5 w-5 mr-2" />
              Today&apos;s Meals
            </h3>
            <button
              onClick={() => setIsAddingMeal(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Meal
            </button>
          </div>
        </div>

        {meals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Apple className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No meals logged today</p>
            <p className="text-sm">Start by adding your first meal!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mealTypes.map((mealType) => {
              const mealsOfType = meals.filter(meal => meal.mealType === mealType);
              
              if (mealsOfType.length === 0) return null;
              
              return (
                <div key={mealType} className="border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {mealType}
                  </h4>
                  
                  <div className="space-y-3">
                    {mealsOfType.map((meal) => (
                      <div 
                        key={meal.id} 
                        className={`p-4 border rounded-lg ${
                          meal.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <span className="font-medium text-gray-900">
                                {meal.food}
                              </span>
                              <span className="ml-2 text-sm text-gray-600">
                                ({meal.quantity} {meal.unit})
                              </span>
                            </div>
                            
                            <div className="flex space-x-4 text-sm text-gray-600">
                              <span className="text-red-600">P: {meal.protein}g</span>
                              <span className="text-blue-600">C: {meal.carbs}g</span>
                              <span className="text-yellow-600">F: {meal.fats}g</span>
                              <span className="text-green-600">{meal.calories} cal</span>
                            </div>
                            
                            {meal.notes && (
                              <p className="mt-1 text-xs text-gray-500">{meal.notes}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => completeMeal(meal.id)}
                              className={`px-3 py-1 rounded text-sm font-medium ${
                                meal.completed
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {meal.completed ? '✓ Done' : 'Mark Done'}
                            </button>
                            <button
                              onClick={() => removeMeal(meal.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Meal Modal */}
      {isAddingMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Meal</h3>
              <button
                onClick={() => setIsAddingMeal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(addMeal)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meal Type
                </label>
                <select
                  className="input-field"
                  {...register('mealType', { required: 'Meal type is required' })}
                >
                  <option value="">Select meal type</option>
                  {mealTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.mealType && (
                  <p className="mt-1 text-sm text-red-600">{errors.mealType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Food Item
                </label>
                <select
                  className="input-field"
                  {...register('food', { required: 'Food item is required' })}
                  onChange={(e) => handleFoodChange(e.target.value)}
                >
                  <option value="">Select or type food item</option>
                  {Object.entries(commonFoods).map(([category, foods]) => (
                    <optgroup key={category} label={category}>
                      {Object.keys(foods).map((food) => (
                        <option key={food} value={food}>{food}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {errors.food && (
                  <p className="mt-1 text-sm text-red-600">{errors.food.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="input-field"
                    placeholder="1"
                    {...register('quantity', { required: 'Quantity is required' })}
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    className="input-field"
                    {...register('unit', { required: 'Unit is required' })}
                  >
                    <option value="">Select unit</option>
                    <option value="g">grams</option>
                    <option value="serving">serving</option>
                    <option value="piece">piece</option>
                    <option value="cup">cup</option>
                    <option value="tbsp">tablespoon</option>
                    <option value="ml">milliliters</option>
                  </select>
                  {errors.unit && (
                    <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="input-field"
                    placeholder="0"
                    {...register('protein')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="input-field"
                    placeholder="0"
                    {...register('carbs')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fats (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="input-field"
                    placeholder="0"
                    {...register('fats')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calories
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    placeholder="0"
                    {...register('calories')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  className="input-field"
                  rows="2"
                  placeholder="Any additional notes..."
                  {...register('notes')}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Add Meal
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingMeal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

NutritionLogger.propTypes = {
  meals: PropTypes.arrayOf(PropTypes.object).isRequired,
  onUpdate: PropTypes.func.isRequired
};

export default NutritionLogger; 