// AI Service for DeepSeek API Integration

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

class AIService {
  constructor() {
    this.apiKey = DEEPSEEK_API_KEY;
    this.model = 'deepseek-chat';
  }

  async generateWeeklyReport(userData, weeklyData) {
    if (!this.apiKey) {
      console.warn('DeepSeek API key not configured. Skipping AI analysis.');
      return this.getMockReport(userData, weeklyData);
    }

    try {
      const prompt = this.createAnalysisPrompt(userData, weeklyData);
      
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are FitTrack AI, an expert fitness and nutrition coach specializing in muscle building and physique development. You analyze user data to provide actionable insights for achieving defined abs, strong shoulders, and arms. Be specific, motivational, and data-driven in your recommendations.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      return this.parseAIResponse(aiResponse, weeklyData);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return this.getMockReport(userData, weeklyData);
    }
  }

  createAnalysisPrompt(userData, weeklyData) {
    const { profile } = userData;
    const {
      workouts,
      nutrition,
      water,
      weights,
      startDate,
      endDate
    } = weeklyData;

    return `
Analyze this week's fitness data for a ${profile.height}cm, ${profile.currentWeight}kg individual aiming for a muscular physique:

USER PROFILE:
- Height: ${profile.height}cm (5'11")
- Current Weight: ${profile.currentWeight}kg
- Goal: Defined abs, strong shoulders, arms
- Target: Lean muscle gain

WEEKLY DATA (${startDate} to ${endDate}):

WORKOUTS COMPLETED: ${workouts.length} sessions
${workouts.map(w => `- ${w.exercise}: ${w.sets}x${w.reps} @ ${w.weight}kg (${w.type})`).join('\n')}

NUTRITION SUMMARY:
- Daily Avg Protein: ${this.calculateAverage(nutrition, 'protein')}g (Goal: 150-160g)
- Daily Avg Carbs: ${this.calculateAverage(nutrition, 'carbs')}g
- Daily Avg Fats: ${this.calculateAverage(nutrition, 'fats')}g
- Daily Avg Calories: ${this.calculateAverage(nutrition, 'calories')}

HYDRATION:
- Daily Avg Water: ${this.calculateAverage(water, 'intake')}ml (Goal: 4000ml)
- Days Goal Met: ${water.filter(d => d.intake >= 4000).length}/7

WEIGHT TREND:
${weights.map(w => `${w.date}: ${w.weight}kg`).join('\n')}

Please provide:
1. WEEKLY PERFORMANCE SUMMARY (2-3 sentences)
2. KEY STRENGTHS (what's going well)
3. AREAS FOR IMPROVEMENT (specific actionable items)
4. NEXT WEEK RECOMMENDATIONS (3-4 specific suggestions)
5. MUSCLE BUILDING INSIGHTS (protein timing, workout progression)
6. TREND ANALYSIS (weight, strength, consistency patterns)

Keep response concise, motivational, and focused on physique goals.
    `;
  }

  parseAIResponse(aiResponse, weeklyData) {
    // Parse AI response into structured data
    try {
      const sections = {
        summary: '',
        strengths: [],
        improvements: [],
        recommendations: [],
        insights: '',
        trends: ''
      };

      const lines = aiResponse.split('\n').filter(line => line.trim());
      let currentSection = '';

      lines.forEach(line => {
        const lower = line.toLowerCase();
        
        if (lower.includes('performance summary') || lower.includes('summary')) {
          currentSection = 'summary';
        } else if (lower.includes('strengths') || lower.includes('going well')) {
          currentSection = 'strengths';
        } else if (lower.includes('improvement') || lower.includes('areas for')) {
          currentSection = 'improvements';
        } else if (lower.includes('recommendation') || lower.includes('next week')) {
          currentSection = 'recommendations';
        } else if (lower.includes('insights') || lower.includes('muscle building')) {
          currentSection = 'insights';
        } else if (lower.includes('trend') || lower.includes('analysis')) {
          currentSection = 'trends';
        } else if (line.trim() && !line.includes(':')) {
          // Content line
          if (currentSection === 'summary' || currentSection === 'insights' || currentSection === 'trends') {
            sections[currentSection] += line.trim() + ' ';
          } else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
            const item = line.replace(/^[-•]\s*/, '').trim();
            if (item && sections[currentSection]) {
              sections[currentSection].push(item);
            }
          }
        }
      });

      return {
        ...sections,
        weeklyStats: this.calculateWeeklyStats(weeklyData),
        generatedAt: new Date().toISOString(),
        rawResponse: aiResponse
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.getMockReport(null, weeklyData);
    }
  }

  calculateWeeklyStats(weeklyData) {
    const { workouts, nutrition, water, weights } = weeklyData;
    
    return {
      totalWorkouts: workouts.length,
      avgProtein: this.calculateAverage(nutrition, 'protein'),
      avgCalories: this.calculateAverage(nutrition, 'calories'),
      avgWater: this.calculateAverage(water, 'intake'),
      proteinGoalDays: nutrition.filter(n => n.protein >= 150).length,
      waterGoalDays: water.filter(w => w.intake >= 4000).length,
      weightChange: weights.length > 1 ? 
        (weights[weights.length - 1].weight - weights[0].weight).toFixed(1) : 0,
      workoutTypes: [...new Set(workouts.map(w => w.type))],
      totalVolume: workouts.reduce((sum, w) => sum + (w.sets * w.reps * w.weight), 0)
    };
  }

  calculateAverage(data, field) {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
    return Math.round(sum / data.length);
  }

  getMockReport(userData, weeklyData) {
    // Fallback mock report when API is not available
    const stats = this.calculateWeeklyStats(weeklyData);
    
    return {
      summary: `Strong week with ${stats.totalWorkouts} workouts completed! Your average protein intake of ${stats.avgProtein}g shows dedication to muscle building goals. ${stats.weightChange > 0 ? 'Positive weight trend indicates muscle gain progress.' : 'Weight stability suggests good body composition maintenance.'}`,
      
      strengths: [
        `Completed ${stats.totalWorkouts} workout sessions this week`,
        `Averaged ${stats.avgProtein}g protein daily (${stats.proteinGoalDays}/7 days hit 150g+ goal)`,
        `Maintained ${stats.avgWater}ml daily water intake`,
        `Diverse training with ${stats.workoutTypes.join(', ')} workouts`
      ],
      
      improvements: [
        stats.avgProtein < 150 ? 'Increase protein intake to 150-160g daily for optimal muscle protein synthesis' : null,
        stats.avgWater < 3500 ? 'Boost daily water intake to 4L, especially on workout days' : null,
        stats.totalWorkouts < 4 ? 'Aim for 4-5 workout sessions per week for consistent progress' : null,
        'Consider tracking progressive overload by gradually increasing weights'
      ].filter(Boolean),
      
      recommendations: [
        'Focus on compound movements: bench press, squats, deadlifts for maximum muscle activation',
        'Time protein intake around workouts: 25-30g within 2 hours post-workout',
        'Ensure 7-9 hours sleep for optimal recovery and muscle growth',
        'Track measurements (chest, shoulders, arms) for physique progress beyond weight'
      ],
      
      insights: `Your ${stats.totalVolume}kg total training volume shows serious commitment. For defined abs and strong shoulders, maintain current protein levels while ensuring progressive overload in key lifts. Weight trend of ${stats.weightChange}kg suggests ${stats.weightChange > 0 ? 'lean muscle gain' : 'body recomposition'} progress.`,
      
      trends: `Training consistency is ${stats.totalWorkouts >= 4 ? 'excellent' : 'needs improvement'}. Nutrition adherence at ${Math.round((stats.proteinGoalDays/7)*100)}% for protein goals. Hydration compliance at ${Math.round((stats.waterGoalDays/7)*100)}%. Focus on consistency for maximum physique development.`,
      
      weeklyStats: stats,
      generatedAt: new Date().toISOString(),
      isDemo: true
    };
  }
}

export const aiService = new AIService();
export default aiService; 