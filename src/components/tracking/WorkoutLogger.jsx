import { useState } from 'react';
import { Plus, X, Dumbbell, Clock, Target, Weight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';

const WorkoutLogger = ({ workouts = [], onUpdate }) => {
  const [isAddingWorkout, setIsAddingWorkout] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const workoutTypes = [
    'Push Day (Chest, Shoulders, Triceps)',
    'Pull Day (Back, Biceps)',
    'Leg Day',
    'Upper Body',
    'Lower Body',
    'Full Body',
    'Cardio',
    'Swimming',
    'Recovery/Stretching'
  ];

  const machines = [
    'Barbell', 'Dumbbell', 'Cable Machine', 'Smith Machine',
    'Leg Press Machine', 'Lat Pulldown Machine', 'Seated Row Machine',
    'Chest Press Machine', 'Shoulder Press Machine', 'Leg Curl Machine',
    'Leg Extension Machine', 'Calf Raise Machine', 'Free Weights', 'Bodyweight'
  ];

  const addWorkout = (data) => {
    const newWorkout = {
      id: Date.now().toString(),
      type: data.type,
      exercise: data.exercise,
      sets: parseInt(data.sets),
      reps: parseInt(data.reps),
      weight: parseFloat(data.weight),
      machine: data.machine,
      duration: data.duration ? parseInt(data.duration) : null,
      notes: data.notes || '',
      completedAt: new Date().toISOString()
    };

    const updatedWorkouts = [...workouts, newWorkout];
    onUpdate(updatedWorkouts);
    reset();
    setIsAddingWorkout(false);
    toast.success('Workout logged successfully!');
  };

  const removeWorkout = (workoutId) => {
    const updatedWorkouts = workouts.filter(w => w.id !== workoutId);
    onUpdate(updatedWorkouts);
    toast.success('Workout removed');
  };

  const completeWorkout = (workoutId) => {
    const updatedWorkouts = workouts.map(w => 
      w.id === workoutId 
        ? { ...w, completed: !w.completed, completedAt: new Date().toISOString() }
        : w
    );
    onUpdate(updatedWorkouts);
    toast.success('Workout marked as complete!');
  };

  return (
    <div className="space-y-6">
      {/* Today's Workouts */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center">
              <Dumbbell className="h-5 w-5 mr-2" />
              Today&apos;s Workouts
            </h3>
            <button
              onClick={() => setIsAddingWorkout(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Workout
            </button>
          </div>
        </div>

        {workouts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No workouts logged today</p>
            <p className="text-sm">Start by logging your first workout!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className={`p-4 border rounded-lg ${
                  workout.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h4 className="font-semibold text-gray-900">{workout.exercise}</h4>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {workout.type}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      {workout.sets && workout.reps && (
                        <div className="flex items-center">
                          <Target className="h-4 w-4 mr-1" />
                          {workout.sets} sets × {workout.reps} reps
                        </div>
                      )}
                      {workout.weight && (
                        <div className="flex items-center">
                          <Weight className="h-4 w-4 mr-1" />
                          {workout.weight} kg
                        </div>
                      )}
                      {workout.duration && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {workout.duration} min
                        </div>
                      )}
                      <div className="text-xs">
                        {workout.machine}
                      </div>
                    </div>
                    
                    {workout.notes && (
                      <p className="mt-2 text-sm text-gray-600">{workout.notes}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => completeWorkout(workout.id)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        workout.completed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {workout.completed ? '✓ Done' : 'Mark Done'}
                    </button>
                    <button
                      onClick={() => removeWorkout(workout.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Workout Modal */}
      {isAddingWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Workout</h3>
              <button
                onClick={() => setIsAddingWorkout(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(addWorkout)} className="space-y-4">
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
                  Exercise
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Bench Press"
                  {...register('exercise', { required: 'Exercise is required' })}
                />
                {errors.exercise && (
                  <p className="mt-1 text-sm text-red-600">{errors.exercise.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sets
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    placeholder="4"
                    {...register('sets', { required: 'Sets are required' })}
                  />
                  {errors.sets && (
                    <p className="mt-1 text-sm text-red-600">{errors.sets.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reps
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    placeholder="8"
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
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="input-field"
                    placeholder="80"
                    {...register('weight')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (min)
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
                  <option value="">Select equipment</option>
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

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Add Workout
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingWorkout(false)}
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

WorkoutLogger.propTypes = {
  workouts: PropTypes.arrayOf(PropTypes.object).isRequired,
  onUpdate: PropTypes.func.isRequired
};

export default WorkoutLogger; 