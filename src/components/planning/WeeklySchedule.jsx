import { useState, useEffect } from 'react';
import { Plus, X, Copy, Clipboard, Check, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import toast from 'react-hot-toast';

const WeeklySchedule = ({ userId, onUpdateSchedule }) => {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [weeklyTasks, setWeeklyTasks] = useState({});
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [copiedWeek, setCopiedWeek] = useState(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

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

  useEffect(() => {
    loadWeeklySchedule();
  }, [currentWeek, userId]);

  const loadWeeklySchedule = async () => {
    // Mock data structure - replace with actual Firebase call
    const weekKey = format(currentWeek, 'yyyy-MM-dd');
    const savedSchedule = localStorage.getItem(`schedule_${userId}_${weekKey}`);
    
    if (savedSchedule) {
      setWeeklyTasks(JSON.parse(savedSchedule));
    } else {
      setWeeklyTasks({});
    }
  };

  const saveWeeklySchedule = async (schedule) => {
    const weekKey = format(currentWeek, 'yyyy-MM-dd');
    localStorage.setItem(`schedule_${userId}_${weekKey}`, JSON.stringify(schedule));
    if (onUpdateSchedule) {
      onUpdateSchedule(schedule);
    }
  };

  const addTask = (data) => {
    const newTask = {
      id: Date.now().toString(),
      title: data.title,
      category: data.category,
      description: data.description || '',
      completed: false,
      createdAt: new Date().toISOString()
    };

    const updatedTasks = {
      ...weeklyTasks,
      [selectedDay]: [...(weeklyTasks[selectedDay] || []), newTask]
    };

    setWeeklyTasks(updatedTasks);
    saveWeeklySchedule(updatedTasks);
    reset();
    setIsAddingTask(false);
    setSelectedDay(null);
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
    toast.success('Task updated!');
  };

  const removeTask = (day, taskId) => {
    const updatedTasks = {
      ...weeklyTasks,
      [day]: weeklyTasks[day].filter(task => task.id !== taskId)
    };

    setWeeklyTasks(updatedTasks);
    saveWeeklySchedule(updatedTasks);
    toast.success('Task removed');
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

      {/* Daily Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {daysOfWeek.map((day, index) => {
          const dayTasks = getTasksForDay(day);
          const dayDate = addDays(currentWeek, index);
          const todayHighlight = isTodayDate(dayDate);
          
          return (
            <div key={day} className={`card ${todayHighlight ? 'ring-2 ring-primary-500' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{day}</h4>
                  <p className="text-sm text-gray-600">{format(dayDate, 'MMM d')}</p>
                  {todayHighlight && (
                    <p className="text-xs text-primary-600 font-medium">Today</p>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setSelectedDay(day);
                    setIsAddingTask(true);
                  }}
                  className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                {dayTasks.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No tasks planned</p>
                ) : (
                  dayTasks.map((task) => (
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
                            
                            <div className="flex items-center space-x-2">
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
                        
                        <button
                          onClick={() => removeTask(day, task.id)}
                          className="text-gray-400 hover:text-red-600 ml-2"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Task for {selectedDay}</h3>
              <button
                onClick={() => {
                  setIsAddingTask(false);
                  setSelectedDay(null);
                  reset();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(addTask)} className="space-y-4">
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
                  {...register('category', { required: 'Category is required' })}
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

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Add Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTask(false);
                    setSelectedDay(null);
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