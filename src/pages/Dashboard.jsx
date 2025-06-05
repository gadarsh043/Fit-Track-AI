import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  TrendingUp, 
  Target, 
  Droplets, 
  Dumbbell, 
  Apple,
  User,
  Menu,
  X,
  Brain,
  Calendar
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
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
    }
  }, [location.pathname, activeTab]);

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

  const updateTodayData = async (field, value) => {
    try {
      const todayStr = format(today, 'yyyy-MM-dd');
      const dayRef = doc(db, 'users', user.uid, 'dailyLogs', todayStr);
      
      const updateData = {
        [field]: value,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(dayRef, updateData);
      setTodayData(prev => ({ ...prev, [field]: value }));
      toast.success('Data updated successfully!');
    } catch {
      // If document doesn't exist, create it
      try {
        await addDoc(collection(db, 'users', user.uid, 'dailyLogs'), {
          date: format(today, 'yyyy-MM-dd'),
          [field]: value,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
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
      
      // Remove existing workout tasks for today
      weeklyTasks[todayName] = weeklyTasks[todayName].filter(task => task.category !== 'Workout');
      
      // Add new workout tasks
      workouts.forEach((workout, index) => {
        weeklyTasks[todayName].push({
          id: `workout_${Date.now()}_${index}`,
          title: workout.exercise,
          category: 'Workout',
          description: `${workout.sets} sets × ${workout.reps} reps`,
          completed: true, // Mark as completed since it's logged
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
    
    // Also update weekly schedule
    const todayName = format(today, 'EEEE');
    const weekKey = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    
    try {
      const savedSchedule = localStorage.getItem(`schedule_${user.uid}_${weekKey}`);
      let weeklyTasks = savedSchedule ? JSON.parse(savedSchedule) : {};
      
      if (!weeklyTasks[todayName]) {
        weeklyTasks[todayName] = [];
      }
      
      // Remove existing nutrition tasks for today
      weeklyTasks[todayName] = weeklyTasks[todayName].filter(task => task.category !== 'Nutrition');
      
      // Add meal summary
      if (meals.length > 0) {
        const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        weeklyTasks[todayName].push({
          id: `nutrition_${Date.now()}`,
          title: `${meals.length} meals logged`,
          category: 'Nutrition',
          description: `Total: ${totalCalories} calories`,
          completed: true,
          createdAt: new Date().toISOString()
        });
      }
      
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
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Workout Tracking</h1>
            <WorkoutLogger
              workouts={todayData.workouts || []}
              onUpdate={handleWorkoutUpdate}
            />
          </div>
        );

      case 'nutrition':
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Nutrition Tracking</h1>
            <NutritionLogger
              meals={todayData.meals || []}
              onUpdate={handleNutritionUpdate}
            />
          </div>
        );

      case 'schedule':
        return (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Weekly Schedule</h1>
            <WeeklySchedule userId={user?.uid} />
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
            <Menu className="h-6 w-6" />
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