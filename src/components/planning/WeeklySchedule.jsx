import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Clipboard, Check, ChevronLeft, ChevronRight, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import toast from 'react-hot-toast';
import { commonFoods, mealTypes, workoutTypes, machines } from '../../constants/foodData';

const WeeklySchedule = ({ userId, onUpdateSchedule }) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weeklyTasks, setWeeklyTasks] = useState({});
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [copiedWeek, setCopiedWeek] = useState(null);
  const [showMoveDropdown, setShowMoveDropdown] = useState(null);
  const [modalType, setModalType] = useState('basic');
  
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm();

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
    'Friday', 'Saturday', 'Sunday'
  ];

  const taskCategories = [
    'Workout',
    'Meal Prep',
    'Nutrition',
    'Water',
    'Supplements',
    'Sleep',
    'Recovery',
    'Other'
  ];

  const loadWeeklySchedule = useCallback(async () => {
    // Mock data structure - replace with actual Firebase call
    const weekKey = format(currentWeek, 'yyyy-MM-dd');
    const savedSchedule = localStorage.getItem(`schedule_${userId}_${weekKey}`);
    
    if (savedSchedule) {
      setWeeklyTasks(JSON.parse(savedSchedule));
    } else {
      setWeeklyTasks({});
    }
  }, [currentWeek, userId]);

  useEffect(() => {
    loadWeeklySchedule();
  }, [currentWeek, userId, loadWeeklySchedule]);

  // Close move dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMoveDropdown && !event.target.closest('.relative')) {
        setShowMoveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMoveDropdown]);

  // Auto-fill nutrition when food is selected (from NutritionLogger)
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

  const saveWeeklySchedule = async (schedule) => {
    const weekKey = format(currentWeek, 'yyyy-MM-dd');
    localStorage.setItem(`schedule_${userId}_${weekKey}`, JSON.stringify(schedule));
    
    // Always trigger sync with workout/nutrition data
    if (onUpdateSchedule) {
      // Add a small delay to ensure localStorage is updated
      setTimeout(() => {
        onUpdateSchedule();
      }, 50);
    }
  };

  const addTask = (data) => {
    let newTask = {
      id: Date.now().toString(),
      category: selectedCategory || data.category,
      completed: false,
      createdAt: new Date().toISOString()
    };

    // Handle different modal types
    if (modalType === 'workout') {
      newTask = {
        ...newTask,
        title: data.exercise || data.title,
        category: 'Workout',
        type: data.type,
        exercise: data.exercise,
        sets: data.sets ? parseInt(data.sets) : null,
        reps: data.reps ? parseInt(data.reps) : null,
        weight: data.weight ? parseFloat(data.weight) : null,
        machine: data.machine,
        duration: data.duration ? parseInt(data.duration) : null,
        notes: data.notes || '',
        description: data.sets && data.reps ? `${data.sets} sets × ${data.reps} reps` : data.notes
      };
    } else if (modalType === 'nutrition') {
      newTask = {
        ...newTask,
        title: data.food || data.title,
        category: 'Nutrition',
        food: data.food,
        quantity: data.quantity ? parseFloat(data.quantity) : null,
        unit: data.unit,
        mealType: data.mealType,
        protein: data.protein ? parseFloat(data.protein) : 0,
        carbs: data.carbs ? parseFloat(data.carbs) : 0,
        fats: data.fats ? parseFloat(data.fats) : 0,
        calories: data.calories ? parseFloat(data.calories) : 0,
        notes: data.notes || '',
        description: data.calories ? `${data.calories} calories` : data.notes
      };
    } else {
      // Basic task
      newTask = {
        ...newTask,
        title: data.title,
        description: data.description || ''
      };

      // For workout tasks, add additional workout-specific fields
      if (selectedCategory === 'Workout') {
        newTask.sets = data.sets ? parseInt(data.sets) : null;
        newTask.reps = data.reps ? parseInt(data.reps) : null;
        newTask.weight = data.weight ? parseFloat(data.weight) : null;
        newTask.description = data.sets && data.reps ? `${data.sets} sets × ${data.reps} reps` : data.description;
      }

      // For nutrition tasks, add calorie information
      if (selectedCategory === 'Nutrition') {
        newTask.calories = data.calories ? parseInt(data.calories) : null;
        newTask.description = data.calories ? `${data.calories} calories` : data.description;
      }
    }

    const updatedTasks = {
      ...weeklyTasks,
      [selectedDay]: [...(weeklyTasks[selectedDay] || []), newTask]
    };

    setWeeklyTasks(updatedTasks);
    saveWeeklySchedule(updatedTasks);
    reset();
    setIsAddingTask(false);
    setSelectedDay(null);
    setSelectedCategory(null);
    setModalType('basic');
    toast.success('Task added successfully!');
  };

  const toggleTask = (day, taskId) => {
    const updatedTasks = {
      ...weeklyTasks,
      [day]: weeklyTasks[day].map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    };

    setWeeklyTasks(updatedTasks);
    saveWeeklySchedule(updatedTasks);
    
    // Trigger sync to update workout/nutrition completion status
    if (onUpdateSchedule) {
      setTimeout(() => {
        onUpdateSchedule();
      }, 50);
    }
    
    toast.success('Task updated!');
  };

  const removeTask = (day, taskId) => {
    // Check if this is an auto-synced task that needs special handling
    const taskToRemove = weeklyTasks[day]?.find(task => task.id === taskId);
    const isAutoSyncedTask = taskToRemove && (
      taskToRemove.id.startsWith('workout_') || 
      taskToRemove.id.startsWith('meal_')
    );
    
    const updatedTasks = {
      ...weeklyTasks,
      [day]: weeklyTasks[day].filter(task => task.id !== taskId)
    };

    setWeeklyTasks(updatedTasks);
    saveWeeklySchedule(updatedTasks);
    
    // If this was an auto-synced task, trigger sync to update workout/nutrition data
    if (isAutoSyncedTask && onUpdateSchedule) {
      setTimeout(() => {
        onUpdateSchedule();
      }, 50);
    }
    
    toast.success('Task removed');
  };

  const moveTask = (fromDay, taskId, toDay) => {
    if (fromDay === toDay) {
      setShowMoveDropdown(null);
      return;
    }

    const taskToMove = weeklyTasks[fromDay]?.find(task => task.id === taskId);
    if (!taskToMove) return;

    // Check if this is an auto-synced task that needs special handling
    const isAutoSyncedTask = taskToMove && (
      taskToMove.id.startsWith('workout_') || 
      taskToMove.id.startsWith('meal_')
    );

    const updatedTasks = {
      ...weeklyTasks,
      [fromDay]: weeklyTasks[fromDay].filter(task => task.id !== taskId),
      [toDay]: [...(weeklyTasks[toDay] || []), taskToMove]
    };

    setWeeklyTasks(updatedTasks);
    saveWeeklySchedule(updatedTasks);
    setShowMoveDropdown(null);
    
    // If this was an auto-synced task, trigger sync to update workout/nutrition data
    if (isAutoSyncedTask && onUpdateSchedule) {
      setTimeout(() => {
        onUpdateSchedule();
      }, 50);
    }
    
    toast.success(`Task moved to ${toDay}`);
  };

  const reorderTask = (day, taskId, direction) => {
    const dayTasks = weeklyTasks[day] || [];
    const taskIndex = dayTasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) return;
    
    const newIndex = direction === 'up' ? taskIndex - 1 : taskIndex + 1;
    
    if (newIndex < 0 || newIndex >= dayTasks.length) return;
    
    const reorderedTasks = [...dayTasks];
    [reorderedTasks[taskIndex], reorderedTasks[newIndex]] = [reorderedTasks[newIndex], reorderedTasks[taskIndex]];
    
    const updatedTasks = {
      ...weeklyTasks,
      [day]: reorderedTasks
    };
    
    setWeeklyTasks(updatedTasks);
    saveWeeklySchedule(updatedTasks);
    toast.success(`Task moved ${direction}`);
  };

  const copyCurrentWeek = () => {
    setCopiedWeek({ ...weeklyTasks });
    toast.success('Week copied to clipboard!');
  };

  const pasteWeek = () => {
    if (!copiedWeek) {
      toast.error('No week copied yet!');
      return;
    }

    // Generate new IDs for pasted tasks
    const pastedTasks = {};
    Object.keys(copiedWeek).forEach(day => {
      pastedTasks[day] = copiedWeek[day].map(task => ({
        ...task,
        id: Date.now().toString() + Math.random(),
        completed: false, // Reset completion status
        createdAt: new Date().toISOString()
      }));
    });

    setWeeklyTasks(pastedTasks);
    saveWeeklySchedule(pastedTasks);
    toast.success('Week pasted successfully!');
  };

  const navigateWeek = (direction) => {
    if (direction === 'prev') {
      setCurrentWeek(subWeeks(currentWeek, 1));
    } else {
      setCurrentWeek(addWeeks(currentWeek, 1));
    }
  };

  const getTasksForDay = (day) => weeklyTasks[day] || [];

  const getCompletionStats = () => {
    let totalTasks = 0;
    let completedTasks = 0;

    Object.values(weeklyTasks).forEach(dayTasks => {
      totalTasks += dayTasks.length;
      completedTasks += dayTasks.filter(task => task.completed).length;
    });

    return { totalTasks, completedTasks, percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0 };
  };

  const stats = getCompletionStats();

  // Helper function to check if a date is today
  const isTodayDate = (date) => {
    const today = new Date();
    return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">
              Week of {format(currentWeek, 'MMM d, yyyy')}
            </h2>
            <p className="text-sm text-gray-600">
              {format(currentWeek, 'MMM d')} - {format(addDays(currentWeek, 6), 'MMM d')}
            </p>
          </div>
          
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={copyCurrentWeek}
            className="btn-secondary flex items-center"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Week
          </button>
          
          <button
            onClick={pasteWeek}
            disabled={!copiedWeek}
            className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Clipboard className="h-4 w-4 mr-2" />
            Paste Week
          </button>
        </div>
      </div>

      {/* Week Statistics */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Week Progress</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">{stats.percentage}%</div>
            <div className="text-sm text-gray-600">{stats.completedTasks}/{stats.totalTasks} tasks</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>
      </div>

      {/* Daily Schedule Grid - Redesigned */}
      <div className="card">
        {/* Tasks Layout - Unified Design */}
        <div className="space-y-3">
          {daysOfWeek.map((day, index) => {
            const dayTasks = getTasksForDay(day);
            const dayDate = addDays(currentWeek, index);
            const todayHighlight = isTodayDate(dayDate);
            
            return (
              <div 
                key={day} 
                className={`border rounded-lg overflow-hidden ${
                  todayHighlight ? 'border-green-400 ring-2 ring-green-200' : 'border-gray-200'
                }`}
              >
                {/* Day Header */}
                <div className={`p-3 flex items-center justify-between ${
                  todayHighlight ? 'bg-green-50' : 'bg-gray-50'
                }`}>
                  <div>
                    <h4 className="font-semibold text-gray-900">{day}</h4>
                    <p className="text-sm text-gray-600">{format(dayDate, 'MMM d')}</p>
                    {todayHighlight && (
                      <p className="text-xs text-green-600 font-medium">🟢 Today</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {dayTasks.filter(t => t.completed).length}/{dayTasks.length} completed
                    </span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedDay(day);
                          setModalType(e.target.value);
                          setSelectedCategory(e.target.value === 'workout' ? 'Workout' : e.target.value === 'nutrition' ? 'Nutrition' : 'Other');
                          setIsAddingTask(true);
                          e.target.value = ''; // Reset dropdown
                        }
                      }}
                      className="p-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      <option value="">+</option>
                      <option value="basic">📝 Basic</option>
                      <option value="workout">💪 Workout</option>
                      <option value="nutrition">🍎 Nutrition</option>
                    </select>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="p-3 space-y-2">
                  {dayTasks.length === 0 ? (
                    <p className="text-sm text-gray-500 italic text-center py-4">No tasks planned</p>
                  ) : (
                    <div className="space-y-2">
                      {dayTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-2 rounded-lg border ${
                            task.completed 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2 flex-1">
                              <button
                                onClick={() => toggleTask(day, task.id)}
                                className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center ${
                                  task.completed
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-gray-300 hover:border-green-500'
                                }`}
                              >
                                {task.completed && <Check className="h-3 w-3" />}
                              </button>
                              
                              <div className="flex-1">
                                <p className={`text-sm font-medium ${
                                  task.completed ? 'line-through text-gray-500' : 'text-gray-900'
                                }`}>
                                  {task.title}
                                </p>
                                
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    getCategoryColor(task.category)
                                  }`}>
                                    {task.category}
                                  </span>
                                </div>
                                
                                {task.description && (
                                  <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1 ml-2">
                              <div className="relative">
                                <button
                                  onClick={() => setShowMoveDropdown(showMoveDropdown === task.id ? null : task.id)}
                                  className="text-gray-400 hover:text-blue-600"
                                  title="Move task"
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </button>
                                
                                {showMoveDropdown === task.id && (
                                  <div className="absolute right-0 top-6 z-50 bg-white border border-gray-200 rounded-md shadow-lg min-w-[120px]">
                                    <div className="py-1">
                                      <div className="px-3 py-1 text-xs font-medium text-gray-500 border-b border-gray-100">
                                        Move to:
                                      </div>
                                      {daysOfWeek.filter(d => d !== day).map((targetDay) => (
                                        <button
                                          key={targetDay}
                                          onClick={() => moveTask(day, task.id, targetDay)}
                                          className="w-full text-left px-3 py-1 text-xs hover:bg-gray-50"
                                        >
                                          {targetDay}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <button
                                onClick={() => reorderTask(day, task.id, 'up')}
                                className="text-gray-400 hover:text-blue-600"
                                title="Move up"
                                disabled={dayTasks.indexOf(task) === 0}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => reorderTask(day, task.id, 'down')}
                                className="text-gray-400 hover:text-blue-600"
                                title="Move down"
                                disabled={dayTasks.indexOf(task) === dayTasks.length - 1}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => removeTask(day, task.id)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {modalType === 'workout' ? 'Add Workout' : 
                 modalType === 'nutrition' ? 'Add Meal' : 
                 `Add Task for ${selectedDay}`}
              </h3>
              <button
                onClick={() => {
                  setIsAddingTask(false);
                  setSelectedDay(null);
                  setSelectedCategory(null);
                  setModalType('basic');
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(addTask)} className="space-y-4">
              {modalType === 'workout' ? (
                // Workout Modal (from WorkoutLogger)
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Workout Type
                    </label>
                    <select
                      className="input-field"
                      {...register('type', { required: 'Workout type is required' })}
                    >
                      <option value="">Select workout type</option>
                      {workoutTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.type && (
                      <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exercise Name
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g., Bench Press"
                      {...register('exercise', { required: 'Exercise name is required' })}
                    />
                    {errors.exercise && (
                      <p className="mt-1 text-sm text-red-600">{errors.exercise.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Sets
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="input-field"
                        placeholder="3"
                        {...register('sets', { required: 'Sets are required' })}
                      />
                      {errors.sets && (
                        <p className="mt-1 text-sm text-red-600">{errors.sets.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Average Reps
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="input-field"
                        placeholder="10"
                        {...register('reps', { required: 'Reps are required' })}
                      />
                      {errors.reps && (
                        <p className="mt-1 text-sm text-red-600">{errors.reps.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Average Weight (kg/lb)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        className="input-field"
                        placeholder="40"
                        {...register('weight')}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Duration (min)
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="input-field"
                        placeholder="30"
                        {...register('duration')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Machine/Equipment
                    </label>
                    <select
                      className="input-field"
                      {...register('machine', { required: 'Machine/Equipment is required' })}
                    >
                      <option value="">Select machine/equipment</option>
                      {machines.map((machine) => (
                        <option key={machine} value={machine}>{machine}</option>
                      ))}
                    </select>
                    {errors.machine && (
                      <p className="mt-1 text-sm text-red-600">{errors.machine.message}</p>
                    )}
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
                </>
              ) : modalType === 'nutrition' ? (
                // Nutrition Modal (from NutritionLogger)
                <>
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
                </>
              ) : (
                // Basic Task Modal
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Task Title
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g., Chest & Triceps workout"
                      {...register('title', { required: 'Task title is required' })}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      className="input-field"
                      value={selectedCategory || ''}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setValue('category', e.target.value);
                      }}
                    >
                      <option value="">Select category</option>
                      {taskCategories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>

                  {/* Workout-specific fields */}
                  {selectedCategory === 'Workout' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sets
                          </label>
                          <input
                            type="number"
                            className="input-field"
                            placeholder="3"
                            {...register('sets')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reps
                          </label>
                          <input
                            type="number"
                            className="input-field"
                            placeholder="10"
                            {...register('reps')}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          className="input-field"
                          placeholder="0"
                          {...register('weight')}
                        />
                      </div>
                    </>
                  )}

                  {/* Nutrition-specific fields */}
                  {selectedCategory === 'Nutrition' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Calories
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder="500"
                        {...register('calories')}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <textarea
                      className="input-field"
                      rows="2"
                      placeholder="Additional details..."
                      {...register('description')}
                    />
                  </div>
                </>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  {modalType === 'workout' ? 'Add Workout' :
                   modalType === 'nutrition' ? 'Add Meal' : 
                   'Add Task'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTask(false);
                    setSelectedDay(null);
                    setSelectedCategory(null);
                    setModalType('basic');
                    reset();
                  }}
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

const getCategoryColor = (category) => {
  const colors = {
    'Workout': 'bg-blue-100 text-blue-800',
    'Meal Prep': 'bg-green-100 text-green-800',
    'Nutrition': 'bg-orange-100 text-orange-800',
    'Water': 'bg-cyan-100 text-cyan-800',
    'Supplements': 'bg-purple-100 text-purple-800',
    'Sleep': 'bg-indigo-100 text-indigo-800',
    'Recovery': 'bg-pink-100 text-pink-800',
    'Other': 'bg-gray-100 text-gray-800'
  };
  return colors[category] || colors['Other'];
};

WeeklySchedule.propTypes = {
  userId: PropTypes.string.isRequired,
  onUpdateSchedule: PropTypes.func
};

export default WeeklySchedule; 