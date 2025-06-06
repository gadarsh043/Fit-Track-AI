import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  TrendingUp, 
  Target, 
  Droplets, 
  Dumbbell, 
  Apple,
  User,
  X,
  Brain,
  Calendar
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format, startOfWeek, addDays } from 'date-fns';
import toast from 'react-hot-toast';

// Components
import WeightChart from '../components/charts/WeightChart';
import MacroChart from '../components/charts/MacroChart';
import WorkoutLogger from '../components/tracking/WorkoutLogger';
import NutritionLogger from '../components/tracking/NutritionLogger';
import WaterTracker from '../components/tracking/WaterTracker';
import AIInsights from '../components/ai/AIInsights';
import WeeklySchedule from '../components/planning/WeeklySchedule';
import ProfileEditor from '../components/profile/ProfileEditor';

const Dashboard = ({ defaultTab = 'overview' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [userProfile, setUserProfile] = useState(null);
  const [todayData, setTodayData] = useState({
    workouts: [],
    meals: [],
    water: 0,
    weight: null
  });
  
  // Fix timezone issues by ensuring we use local date
  const today = useMemo(() => {
    const now = new Date();
    // Create a new date in local timezone, not UTC
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);
  
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start week on Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Handle tab changes with navigation
  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    
    // Update URL based on tab
    const routes = {
      'overview': '/dashboard',
      'workouts': '/workouts',
      'nutrition': '/nutrition',
      'schedule': '/schedule',
      'progress': '/progress',
      'ai-insights': '/ai-insights',
      'profile': '/profile'
    };
    
    if (routes[tab]) {
      navigate(routes[tab], { replace: true });
    }
  }, [navigate]);

  // Set active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    const tabMap = {
      '/dashboard': 'overview',
      '/workouts': 'workouts',
      '/nutrition': 'nutrition',
      '/schedule': 'schedule',
      '/progress': 'progress',
      '/ai-insights': 'ai-insights',
      '/profile': 'profile'
    };
    
    if (tabMap[path] && tabMap[path] !== activeTab) {
      setActiveTab(tabMap[path]);
      // Force sync when switching tabs (but don't add syncScheduleToData as dependency)
      if (user && todayData) {
        setTimeout(() => {
          // Call sync function here without dependency
          const syncData = async () => {
            const todayName = format(today, 'EEEE');
            const weekKey = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
            
            try {
              const savedSchedule = localStorage.getItem(`schedule_${user.uid}_${weekKey}`);
              if (savedSchedule) {
                const weeklyTasks = JSON.parse(savedSchedule);
                const todayTasks = weeklyTasks[todayName] || [];
                
                // Quick sync without full function call
                const workoutTasks = todayTasks.filter(task => task.category === 'Workout');
                const nutritionTasks = todayTasks.filter(task => task.category === 'Nutrition');
                
                if (workoutTasks.length > 0 || nutritionTasks.length > 0) {
                  // Trigger a state update to force re-render
                  setTodayData(prev => ({ ...prev }));
                }
              }
            } catch (error) {
              console.error('Error in quick sync:', error);
            }
          };
          syncData();
        }, 100);
      }
    }
  }, [location.pathname, activeTab, user, todayData, today]);

  const loadUserData = useCallback(async () => {
    try {
      const profileDoc = await getDoc(doc(db, 'users', user.uid, 'profile', 'data'));
      if (profileDoc.exists()) {
        setUserProfile(profileDoc.data());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [user?.uid]);

  const loadTodayData = useCallback(async () => {
    try {
      const todayStr = format(today, 'yyyy-MM-dd');
      const dayDoc = await getDoc(doc(db, 'users', user.uid, 'dailyLogs', todayStr));
      
      if (dayDoc.exists()) {
        setTodayData(dayDoc.data());
      }
    } catch (error) {
      console.error('Error loading today data:', error);
    }
  }, [user?.uid, today]);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadTodayData();
    }
  }, [user, loadUserData, loadTodayData]);

  // Function to sync weekly schedule back to workout/nutrition data
  const syncScheduleToData = useCallback(async () => {
    const todayName = format(today, 'EEEE');
    const weekKey = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    try {
      const savedSchedule = localStorage.getItem(`schedule_${user.uid}_${weekKey}`);
      if (!savedSchedule) return;
      
      const weeklyTasks = JSON.parse(savedSchedule);
      const todayTasks = weeklyTasks[todayName] || [];
      
      // Only sync workout tasks that were MANUALLY created in schedule (not auto-synced from workouts)
      // Auto-synced workout tasks have IDs that start with 'workout_'
      // Manually created tasks have simple timestamp IDs
      const manualWorkoutTasks = todayTasks.filter(task => 
        task.category === 'Workout' && 
        !task.id.startsWith('workout_') // Exclude auto-synced tasks
      );
      
      if (manualWorkoutTasks.length > 0) {
        const workoutData = manualWorkoutTasks.map(task => {
          // Parse description to extract sets and reps if available
          const setRepsMatch = task.description?.match(/(\d+) sets × (\d+) reps/);
          return {
            id: `schedule_workout_${task.id}`, // Prefix to identify schedule-originated workouts
            exercise: task.title,
            sets: task.sets || (setRepsMatch ? parseInt(setRepsMatch[1]) : 3),
            reps: task.reps || (setRepsMatch ? parseInt(setRepsMatch[2]) : 10),
            weight: task.weight || 0, // Use task weight or default to 0
            notes: task.description || '',
            completed: task.completed || false, // Sync completion status
            source: 'schedule',
            createdAt: task.createdAt
          };
        });
        
        // Update workout data - only add schedule-originated workouts
        const existingWorkouts = todayData.workouts || [];
        const nonScheduleWorkouts = existingWorkouts.filter(workout => !workout.id.startsWith('schedule_workout_'));
        const mergedWorkouts = [...nonScheduleWorkouts, ...workoutData];
        
        // Only update if data has actually changed
        const existingScheduleWorkouts = existingWorkouts.filter(workout => workout.id && workout.id.startsWith('schedule_workout_'));
        const workoutDataChanged = JSON.stringify(existingScheduleWorkouts) !== JSON.stringify(workoutData);
        
        if (workoutDataChanged) {
          setTodayData(prev => ({ ...prev, workouts: mergedWorkouts }));
        }
      } else {
        // Remove schedule-originated workouts if no manual workout tasks exist
        const existingWorkouts = todayData.workouts || [];
        const nonScheduleWorkouts = existingWorkouts.filter(workout => !workout.id.startsWith('schedule_workout_'));
        if (nonScheduleWorkouts.length !== existingWorkouts.length) {
          setTodayData(prev => ({ ...prev, workouts: nonScheduleWorkouts }));
        }
      }
      
      // Also sync completion status for auto-synced workout tasks back to workout data
      const autoSyncedWorkoutTasks = todayTasks.filter(task => 
        task.category === 'Workout' && task.id.startsWith('workout_')
      );
      
      if (autoSyncedWorkoutTasks.length > 0) {
        const existingWorkouts = todayData.workouts || [];
        const updatedWorkouts = existingWorkouts.map(workout => {
          // Find corresponding task in schedule
          const scheduleTask = autoSyncedWorkoutTasks.find(task => 
            task.title === workout.exercise && 
            task.description?.includes(`${workout.sets} sets × ${workout.reps} reps`)
          );
          
          if (scheduleTask && workout.completed !== scheduleTask.completed) {
            return { ...workout, completed: scheduleTask.completed };
          }
          return workout;
        });
        
        // Update if completion status changed
        if (JSON.stringify(updatedWorkouts) !== JSON.stringify(existingWorkouts)) {
          setTodayData(prev => ({ ...prev, workouts: updatedWorkouts }));
        }
      } else {
        // If NO auto-synced workout tasks exist, remove all auto-synced workouts from data
        const existingWorkouts = todayData.workouts || [];
        const nonAutoSyncedWorkouts = existingWorkouts.filter(workout => 
          !workout.id || !workout.id.startsWith('schedule_workout_')
        );
        
        if (nonAutoSyncedWorkouts.length !== existingWorkouts.length) {
          setTodayData(prev => ({ ...prev, workouts: nonAutoSyncedWorkouts }));
        }
      }
      
      // Sync nutrition tasks to nutrition data - SAME LOGIC AS WORKOUTS
      const nutritionTasks = todayTasks.filter(task => task.category === 'Nutrition');
      const existingMeals = todayData.meals || [];
      
      if (nutritionTasks.length > 0) {
        // Only sync meal tasks that were MANUALLY created in schedule (not auto-synced from nutrition)
        // Auto-synced meal tasks have IDs that start with 'meal_'
        // Manually created tasks have simple timestamp IDs
        const manualNutritionTasks = nutritionTasks.filter(task => 
          !task.id.startsWith('meal_') // Exclude auto-synced tasks
        );
        
        if (manualNutritionTasks.length > 0) {
          const mealData = manualNutritionTasks.map(task => {
            // Parse description to extract calories if available
            const caloriesMatch = task.description?.match(/(\d+) cal/);
            return {
              id: `schedule_meal_${task.id}`, // Prefix to identify schedule-originated meals
              food: task.title,
              mealType: task.mealType || 'Other',
              calories: task.calories || (caloriesMatch ? parseInt(caloriesMatch[1]) : 500),
              protein: task.protein || Math.round((task.calories || 500) * 0.25 / 4),
              carbs: task.carbs || Math.round((task.calories || 500) * 0.45 / 4),
              fats: task.fats || Math.round((task.calories || 500) * 0.30 / 9),
              quantity: task.quantity || 1,
              unit: task.unit || 'serving',
              notes: task.description || '',
              completed: task.completed || false, // Sync completion status
              source: 'schedule',
              createdAt: task.createdAt
            };
          });
          
          // Update meal data - only add schedule-originated meals
          const nonScheduleMeals = existingMeals.filter(meal => !meal.id.startsWith('schedule_meal_'));
          const mergedMeals = [...nonScheduleMeals, ...mealData];
          
          // Only update if data has actually changed
          const existingScheduleMeals = existingMeals.filter(meal => meal.id && meal.id.startsWith('schedule_meal_'));
          const mealDataChanged = JSON.stringify(existingScheduleMeals) !== JSON.stringify(mealData);
          
          if (mealDataChanged) {
            setTodayData(prev => ({ ...prev, meals: mergedMeals }));
          }
        } else {
          // Remove schedule-originated meals if no manual nutrition tasks exist
          const nonScheduleMeals = existingMeals.filter(meal => !meal.id.startsWith('schedule_meal_'));
          if (nonScheduleMeals.length !== existingMeals.length) {
            setTodayData(prev => ({ ...prev, meals: nonScheduleMeals }));
          }
        }
      } else {
        // Remove all schedule meals if no nutrition tasks
        const nonScheduleMeals = existingMeals.filter(meal => !meal.id.startsWith('schedule_meal_'));
        if (nonScheduleMeals.length !== existingMeals.length) {
          setTodayData(prev => ({ ...prev, meals: nonScheduleMeals }));
        }
      }

      // Also sync completion status for auto-synced meal tasks back to meal data
      const autoSyncedMealTasks = todayTasks.filter(task => 
        task.category === 'Nutrition' && task.id.startsWith('meal_')
      );
      
      if (autoSyncedMealTasks.length > 0) {
        const existingMeals = todayData.meals || [];
        const updatedMeals = existingMeals.map(meal => {
          // Find corresponding task in schedule using mealData.id
          const scheduleTask = autoSyncedMealTasks.find(task => 
            task.mealData?.id === meal.id
          );
          
          if (scheduleTask && meal.completed !== scheduleTask.completed) {
            return { ...meal, completed: scheduleTask.completed };
          }
          return meal;
        });
        
        // Update if completion status changed
        if (JSON.stringify(updatedMeals) !== JSON.stringify(existingMeals)) {
          setTodayData(prev => ({ ...prev, meals: updatedMeals }));
        }
      } else {
        // If NO auto-synced meal tasks exist, remove all auto-synced meals from data
        const existingMeals = todayData.meals || [];
        const nonAutoSyncedMeals = existingMeals.filter(meal => 
          !meal.id || !meal.id.startsWith('schedule_meal_')
        );
        
        if (nonAutoSyncedMeals.length !== existingMeals.length) {
          setTodayData(prev => ({ ...prev, meals: nonAutoSyncedMeals }));
        }
      }
    } catch (error) {
      console.error('Error syncing schedule to data:', error);
    }
  }, [today, user?.uid, todayData.workouts, todayData.meals]);

  const updateTodayData = async (field, value) => {
    try {
      const todayStr = format(today, 'yyyy-MM-dd');
      const dayRef = doc(db, 'users', user.uid, 'dailyLogs', todayStr);
      
      const updateData = {
        [field]: value,
        date: todayStr, // Ensure date is always set
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(dayRef, updateData);
      setTodayData(prev => ({ ...prev, [field]: value }));
      toast.success('Data updated successfully!');
    } catch (updateError) {
      // If document doesn't exist, create it with the correct document ID
      console.log('Document does not exist, creating new one:', updateError.message);
      try {
        const todayStr = format(today, 'yyyy-MM-dd');
        const dayRef = doc(db, 'users', user.uid, 'dailyLogs', todayStr);
        
        const newDocData = {
          date: todayStr,
          [field]: value,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await setDoc(dayRef, newDocData, { merge: true });
        
        setTodayData(prev => ({ ...prev, [field]: value }));
        toast.success('Data saved successfully!');
      } catch (saveError) {
        console.error('Error creating day log:', saveError);
        toast.error('Failed to save data');
      }
    }
  };

  // Function to sync workout with weekly schedule
  const handleWorkoutUpdate = useCallback(async (workouts) => {
    await updateTodayData('workouts', workouts);
    
    // Also update weekly schedule
    const todayName = format(today, 'EEEE'); // Monday, Tuesday, etc.
    const weekKey = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    try {
      // Get existing weekly schedule
      const savedSchedule = localStorage.getItem(`schedule_${user.uid}_${weekKey}`);
      let weeklyTasks = savedSchedule ? JSON.parse(savedSchedule) : {};
      
      // Update workout-related tasks for today
      if (!weeklyTasks[todayName]) {
        weeklyTasks[todayName] = [];
      }
      
      // Remove existing auto-synced workout tasks for today (but preserve manually created ones)
      weeklyTasks[todayName] = weeklyTasks[todayName].filter(task => 
        task.category !== 'Workout' || !task.id.startsWith('workout_')
      );
      
      // Add new workout tasks (this handles both additions and deletions)
      workouts.forEach((workout, index) => {
        weeklyTasks[todayName].push({
          id: `workout_${Date.now()}_${index}`,
          title: workout.exercise,
          category: 'Workout',
          description: `${workout.sets} sets × ${workout.reps} reps`,
          completed: workout.completed || false, // Sync completion status
          createdAt: new Date().toISOString()
        });
      });
      
      // Save updated schedule
      localStorage.setItem(`schedule_${user.uid}_${weekKey}`, JSON.stringify(weeklyTasks));
    } catch (error) {
      console.error('Error syncing workout with schedule:', error);
    }
  }, [today, user?.uid, updateTodayData]);

  // Function to sync nutrition with weekly schedule
  const handleNutritionUpdate = useCallback(async (meals) => {
    await updateTodayData('meals', meals);
    
    // Also update weekly schedule - SAME LOGIC AS WORKOUTS
    const todayName = format(today, 'EEEE');
    const weekKey = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    try {
      const savedSchedule = localStorage.getItem(`schedule_${user.uid}_${weekKey}`);
      let weeklyTasks = savedSchedule ? JSON.parse(savedSchedule) : {};
      
      if (!weeklyTasks[todayName]) {
        weeklyTasks[todayName] = [];
      }
      
      // Remove existing auto-synced nutrition tasks for today (but preserve manually created ones)
      weeklyTasks[todayName] = weeklyTasks[todayName].filter(task => 
        task.category !== 'Nutrition' || !task.id.startsWith('meal_')
      );
      
      // Add new meal tasks (this handles both additions and deletions)
      meals.forEach((meal, index) => {
        weeklyTasks[todayName].push({
          id: `meal_${Date.now()}_${index}`,
          title: meal.food || meal.name,
          category: 'Nutrition',
          description: `${meal.calories} cal (${meal.mealType})`,
          completed: meal.completed || false, // Sync completion status
          createdAt: new Date().toISOString(),
          // Store meal data for reverse sync
          mealData: {
            id: meal.id,
            food: meal.food,
            mealType: meal.mealType,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats
          }
        });
      });
      
      localStorage.setItem(`schedule_${user.uid}_${weekKey}`, JSON.stringify(weeklyTasks));
    } catch (error) {
      console.error('Error syncing nutrition with schedule:', error);
    }
  }, [today, user?.uid, updateTodayData]);

  const sidebarNavItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp, path: '/dashboard' },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell, path: '/workouts' },
    { id: 'nutrition', label: 'Nutrition', icon: Apple, path: '/nutrition' },
    { id: 'schedule', label: 'Weekly Schedule', icon: Calendar, path: '/schedule' },
    { id: 'progress', label: 'Progress', icon: Target, path: '/progress' },
    { id: 'ai-insights', label: 'AI Insights', icon: Brain, path: '/ai-insights' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  // Run sync after all functions are defined
  useEffect(() => {
    if (user && todayData && syncScheduleToData) {
      const timeoutId = setTimeout(() => {
        syncScheduleToData();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, todayData.workouts?.length, todayData.meals?.length, 
      // Also watch for completion status changes
      todayData.workouts?.map(w => w.completed).join(','),
      todayData.meals?.map(m => m.completed).join(',')
  ]);

  const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => (
    <div className="card">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-${color}-100 text-${color}-600 mr-4`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    subtitle: PropTypes.string,
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {userProfile?.displayName?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-gray-600">{format(today, 'EEEE, MMMM d, yyyy')}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Current Weight"
                value={`${userProfile?.currentWeight || '--'} kg`}
                icon={TrendingUp}
                color="blue"
              />
              <StatCard
                title="Water Intake"
                value={`${todayData.water || 0} ml`}
                subtitle={`Goal: ${userProfile?.waterGoal || 4000} ml`}
                icon={Droplets}
                color="cyan"
              />
              <StatCard
                title="Workouts Today"
                value={todayData.workouts?.length || 0}
                icon={Dumbbell}
                color="green"
              />
              <StatCard
                title="Meals Logged"
                value={todayData.meals?.length || 0}
                icon={Apple}
                color="orange"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Weight Progress</h3>
                <WeightChart data={[]} />
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Daily Macros</h3>
                <MacroChart data={todayData.meals || []} />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => handleTabChange('workouts')}
                  className="btn-primary"
                >
                  Log Workout
                </button>
                <button
                  onClick={() => handleTabChange('nutrition')}
                  className="btn-secondary"
                >
                  Add Meal
                </button>
                <WaterTracker
                  currentIntake={todayData.water || 0}
                  goal={4000}
                  onUpdate={(value) => updateTodayData('water', value)}
                />
                <button
                  onClick={() => handleTabChange('progress')}
                  className="btn-secondary"
                >
                  View Progress
                </button>
              </div>
            </div>
          </div>
        );

      case 'workouts':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Workout Tracking</h1>
              <button
                onClick={() => {
                  // Refresh data from Firebase
                  loadTodayData();
                  toast.success('Data refreshed!');
                }}
                className="btn-secondary text-sm"
                title="Refresh workout data"
              >
                🔄 Refresh
              </button>
            </div>
            <WorkoutLogger
              workouts={todayData.workouts || []}
              onUpdate={handleWorkoutUpdate}
            />
          </div>
        );

      case 'nutrition':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Nutrition Tracking</h1>
              <button
                onClick={() => {
                  // Refresh data from Firebase
                  loadTodayData();
                  toast.success('Data refreshed!');
                }}
                className="btn-secondary text-sm"
                title="Refresh nutrition data"
              >
                🔄 Refresh
              </button>
            </div>
            <NutritionLogger
              meals={todayData.meals || []}
              onUpdate={handleNutritionUpdate}
            />
          </div>
        );

      case 'schedule':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Weekly Schedule</h1>
              <button
                onClick={() => syncScheduleToData()}
                className="btn-secondary text-sm"
                title="Sync with workout/nutrition data"
              >
                🔄 Sync Data
              </button>
            </div>
            <WeeklySchedule 
              userId={user?.uid} 
              onUpdateSchedule={syncScheduleToData}
            />
          </div>
        );

      case 'progress':
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Progress Tracking</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Weight Trend</h3>
                <WeightChart data={[]} />
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Weekly Overview</h3>
                <div className="space-y-4">
                  {weekDays.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{format(day, 'EEE, MMM d')}</span>
                      <div className="flex space-x-2">
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                          ✓ Workout
                        </span>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          ✓ Nutrition
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'ai-insights':
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Insights</h1>
            <AIInsights />
          </div>
        );

      case 'profile':
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile Settings</h1>
            <ProfileEditor 
              userProfile={userProfile} 
              onProfileUpdate={loadUserData} 
              userId={user?.uid}
              onLogout={logout}
            />
          </div>
        );

      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <button
            onClick={() => handleTabChange('overview')}
            className="text-xl font-bold text-primary-900 hover:text-primary-700 transition-colors"
          >
            FitTrack AI
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-6">
          {sidebarNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 ${
                activeTab === item.id ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' : 'text-gray-700'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">FitTrack AI</h1>
          <div className="w-6" /> {/* Spacer */}
        </div>

        {/* Content */}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

Dashboard.propTypes = {
  defaultTab: PropTypes.string
};

export default Dashboard; 