import { Link } from 'react-router-dom';
import { 
  Dumbbell, 
  Apple, 
  TrendingUp, 
  Target, 
  Droplets, 
  Brain,
  CheckCircle,
  ArrowRight,
  Zap
} from 'lucide-react';

function Home() {
  const features = [
    {
      icon: Dumbbell,
      title: 'Workout Tracking',
      description: 'Log your gym sessions, track weights lifted, sets, reps, and monitor your strength progression.',
      color: 'text-green-600'
    },
    {
      icon: Apple,
      title: 'Nutrition Logging',
      description: 'Track your meals, macros (protein, carbs, fats), and ensure you hit your daily nutrition goals.',
      color: 'text-red-600'
    },
    {
      icon: Droplets,
      title: 'Water Intake',
      description: 'Monitor your daily hydration with easy water tracking and goal achievement notifications.',
      color: 'text-blue-600'
    },
    {
      icon: TrendingUp,
      title: 'Progress Analytics',
      description: 'Visualize your weight trends, macro adherence, and workout consistency with detailed charts.',
      color: 'text-purple-600'
    },
    {
      icon: Brain,
      title: 'AI Insights',
      description: 'Get weekly AI-powered analysis of your progress with personalized recommendations.',
      color: 'text-indigo-600'
    },
    {
      icon: Target,
      title: 'Goal Setting',
      description: 'Set and track your fitness goals, from weight targets to strength milestones.',
      color: 'text-yellow-600'
    }
  ];

  const benefits = [
    'Achieve defined abs and strong shoulders',
    'Track 150-160g daily protein intake',
    'Monitor gym workouts and swimming sessions',
    'Log creatine and supplement intake',
    'Visualize weight and body composition changes',
    'Get AI-powered weekly performance insights'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-900">FitTrack AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Your 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
              {" "}Physique
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI-powered fitness and nutrition tracking designed to help you achieve a gym physique 
            with defined abs, strong shoulders, and arms. Track workouts, nutrition, and get 
            personalized insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="btn-primary flex items-center justify-center text-lg px-8 py-4"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="btn-secondary flex items-center justify-center text-lg px-8 py-4"
            >
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">150-160g</div>
              <div className="text-gray-600">Daily Protein Target</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary-600">AI-Powered</div>
              <div className="text-gray-600">Weekly Insights</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">Complete</div>
              <div className="text-gray-600">Fitness Tracking</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Build Your Dream Physique
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tracking tools designed specifically for serious fitness enthusiasts 
              aiming for muscle gain and defined aesthetics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow duration-200">
                <div className={`inline-flex p-3 rounded-lg bg-gray-100 mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Built for Serious Athletes
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Whether you&apos;re aiming for a lean 75kg physique at 5&apos;11&quot; or pushing for strength gains,
                FitTrack AI adapts to your unique journey with personalized insights.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <Zap className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sample Daily Tracking</h3>
                <p className="text-gray-600">What a typical day looks like</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Bench Press (4x8)</span>
                  <span className="font-semibold text-primary-600">80kg</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Chicken Breast</span>
                  <span className="font-semibold text-red-600">31g protein</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Water Intake</span>
                  <span className="font-semibold text-blue-600">3.5L / 4L</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Creatine</span>
                  <span className="font-semibold text-green-600">5g ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Physique?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of athletes using FitTrackAI to achieve their dream physique. 
            Start tracking your workouts, nutrition, and progress today.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center bg-white text-primary-600 font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors text-lg"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">FitTrack AI</h3>
            <p className="text-gray-400 mb-6">
              AI-powered fitness tracking for serious athletes
            </p>
            <div className="flex justify-center space-x-6">
              <Link to="/login" className="text-gray-400 hover:text-white">
                Sign In
              </Link>
              <Link to="/signup" className="text-gray-400 hover:text-white">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;