import { useState, useEffect, useCallback } from 'react';
import { Brain, TrendingUp, Target, AlertCircle, CheckCircle, Calendar, BarChart3, Loader } from 'lucide-react';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';
import { aiService } from '../../services/aiService';
import { dataService } from '../../services/dataService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AIInsights = () => {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previousReports, setPreviousReports] = useState([]);

  const loadPreviousReports = useCallback(async () => {
    try {
      const reports = await dataService.getPreviousReports(user.uid, 3);
      setPreviousReports(reports);
    } catch (error) {
      console.error('Error loading previous reports:', error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user) {
      loadPreviousReports();
    }
  }, [user, loadPreviousReports]);

  const generateWeeklyReport = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get current week's data
      const weeklyData = await dataService.getWeeklyData(user.uid);
      
      // Generate AI analysis
      const aiReport = await aiService.generateWeeklyReport(
        { profile: weeklyData.profile },
        weeklyData
      );
      
      setReport(aiReport);
      
      // Save the report to Firestore
      try {
        await dataService.saveWeeklyReport(
          user.uid,
          new Date(weeklyData.startDate),
          aiReport
        );
        toast.success('Weekly report generated and saved!');
      } catch (saveError) {
        console.error('Error saving report:', saveError);
        toast.success('Weekly report generated!');
      }
      
      // Refresh previous reports
      loadPreviousReports();
      
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate weekly report. Please try again.');
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600 mr-3`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  StatCard.propTypes = {
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    subtitle: PropTypes.string,
    color: PropTypes.string
  };

  const RecommendationItem = ({ text, type = 'recommendation' }) => {
    const Icon = type === 'strength' ? CheckCircle : 
                 type === 'improvement' ? AlertCircle : Target;
    const colorClass = type === 'strength' ? 'text-green-600' : 
                       type === 'improvement' ? 'text-yellow-600' : 'text-blue-600';
    
    return (
      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
        <Icon className={`h-5 w-5 mt-0.5 ${colorClass} flex-shrink-0`} />
        <p className="text-sm text-gray-700">{text}</p>
      </div>
    );
  };

  RecommendationItem.propTypes = {
    text: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['strength', 'improvement', 'recommendation'])
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Brain className="h-6 w-6 text-purple-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Insights</h2>
            <p className="text-gray-600">Weekly analysis and personalized recommendations</p>
          </div>
        </div>
        
        <button
          onClick={generateWeeklyReport}
          disabled={loading}
          className="btn-primary flex items-center"
        >
          {loading ? (
            <Loader className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Brain className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Analyzing...' : 'Generate Weekly Report'}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Current Report */}
      {report && (
        <div className="space-y-6">
          {/* Week Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Week Summary
                {report.isDemo && (
                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                    Demo Mode
                  </span>
                )}
              </h3>
            </div>
            
            <p className="text-gray-700 leading-relaxed">{report.summary}</p>
            
            {/* Weekly Stats */}
            {report.weeklyStats && (
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={TrendingUp}
                  title="Workouts"
                  value={report.weeklyStats.totalWorkouts}
                  subtitle="sessions completed"
                  color="green"
                />
                <StatCard
                  icon={Target}
                  title="Avg Protein"
                  value={`${report.weeklyStats.avgProtein}g`}
                  subtitle="daily average"
                  color="red"
                />
                <StatCard
                  icon={CheckCircle}
                  title="Protein Goals"
                  value={`${report.weeklyStats.proteinGoalDays}/7`}
                  subtitle="days hit 150g+"
                  color="blue"
                />
                <StatCard
                  icon={BarChart3}
                  title="Weight Change"
                  value={`${report.weeklyStats.weightChange > 0 ? '+' : ''}${report.weeklyStats.weightChange}kg`}
                  subtitle="this week"
                  color="purple"
                />
              </div>
            )}
          </div>

          {/* Strengths */}
          {report.strengths && report.strengths.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold flex items-center text-green-700">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  What&apos;s Going Well
                </h3>
              </div>
              
              <div className="space-y-3">
                {report.strengths.map((strength, index) => (
                  <RecommendationItem key={index} text={strength} type="strength" />
                ))}
              </div>
            </div>
          )}

          {/* Areas for Improvement */}
          {report.improvements && report.improvements.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold flex items-center text-yellow-700">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Areas for Improvement
                </h3>
              </div>
              
              <div className="space-y-3">
                {report.improvements.map((improvement, index) => (
                  <RecommendationItem key={index} text={improvement} type="improvement" />
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations && report.recommendations.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold flex items-center text-blue-700">
                  <Target className="h-5 w-5 mr-2" />
                  Next Week Recommendations
                </h3>
              </div>
              
              <div className="space-y-3">
                {report.recommendations.map((recommendation, index) => (
                  <RecommendationItem key={index} text={recommendation} type="recommendation" />
                ))}
              </div>
            </div>
          )}

          {/* Insights & Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {report.insights && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Muscle Building Insights</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">{report.insights}</p>
              </div>
            )}
            
            {report.trends && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Trend Analysis</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">{report.trends}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previous Reports */}
      {previousReports.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Previous Reports
            </h3>
          </div>
          
          <div className="space-y-3">
            {previousReports.map((prevReport) => (
              <div
                key={prevReport.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => setReport(prevReport)}
              >
                <div>
                  <p className="font-medium text-gray-900">
                    Week {prevReport.weekNumber}, {prevReport.year}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(prevReport.weekStart), 'MMM d')} - {format(new Date(prevReport.weekEnd), 'MMM d')}
                  </p>
                </div>
                <div className="text-right">
                  {prevReport.weeklyStats && (
                    <p className="text-sm font-medium text-gray-900">
                      {prevReport.weeklyStats.totalWorkouts} workouts
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {format(new Date(prevReport.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!report && !loading && (
        <div className="card text-center py-12">
          <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Generate Your First AI Report
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Get personalized insights on your fitness progress, nutrition adherence, 
            and recommendations for achieving your physique goals.
          </p>
          <button
            onClick={generateWeeklyReport}
            className="btn-primary"
          >
            <Brain className="h-4 w-4 mr-2" />
            Generate Weekly Report
          </button>
        </div>
      )}
    </div>
  );
};

export default AIInsights; 