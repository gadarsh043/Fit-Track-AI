import { collection, query, where, getDocs, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { startOfWeek, endOfWeek, format, subDays } from 'date-fns';

class DataService {
  async getWeeklyData(userId, weekStart = null) {
    try {
      // Default to current week if no date provided
      const startDate = weekStart || startOfWeek(new Date());
      const endDate = endOfWeek(startDate);
      
      const [userData, workouts, nutrition, water, weights] = await Promise.all([
        this.getUserProfile(userId),
        this.getWeeklyWorkouts(userId, startDate, endDate),
        this.getWeeklyNutrition(userId, startDate, endDate),
        this.getWeeklyWater(userId, startDate, endDate),
        this.getWeeklyWeights(userId, startDate, endDate)
      ]);

      return {
        profile: userData,
        workouts,
        nutrition,
        water,
        weights,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        weekNumber: this.getWeekNumber(startDate)
      };
    } catch (error) {
      console.error('Error fetching weekly data:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      const profileDoc = await getDoc(doc(db, 'users', userId, 'profile', 'data'));
      if (profileDoc.exists()) {
        return profileDoc.data();
      }
      throw new Error('User profile not found');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async getWeeklyWorkouts(userId, startDate, endDate) {
    try {
      const workouts = [];
      const dailyLogsRef = collection(db, 'users', userId, 'dailyLogs');
      
      // Query for the date range
      const q = query(
        dailyLogsRef,
        where('date', '>=', format(startDate, 'yyyy-MM-dd')),
        where('date', '<=', format(endDate, 'yyyy-MM-dd')),
        orderBy('date')
      );
      
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.workouts && Array.isArray(data.workouts)) {
          workouts.push(...data.workouts.map(workout => ({
            ...workout,
            date: data.date
          })));
        }
      });
      
      return workouts;
    } catch (error) {
      console.error('Error fetching weekly workouts:', error);
      return [];
    }
  }

  async getWeeklyNutrition(userId, startDate, endDate) {
    try {
      const nutritionData = [];
      const dailyLogsRef = collection(db, 'users', userId, 'dailyLogs');
      
      const q = query(
        dailyLogsRef,
        where('date', '>=', format(startDate, 'yyyy-MM-dd')),
        where('date', '<=', format(endDate, 'yyyy-MM-dd')),
        orderBy('date')
      );
      
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.meals && Array.isArray(data.meals)) {
          // Calculate daily totals
          const dailyTotals = data.meals.reduce((totals, meal) => ({
            protein: totals.protein + (meal.protein || 0),
            carbs: totals.carbs + (meal.carbs || 0),
            fats: totals.fats + (meal.fats || 0),
            calories: totals.calories + (meal.calories || 0)
          }), { protein: 0, carbs: 0, fats: 0, calories: 0 });
          
          nutritionData.push({
            date: data.date,
            ...dailyTotals,
            meals: data.meals
          });
        } else {
          // Add empty day
          nutritionData.push({
            date: data.date,
            protein: 0,
            carbs: 0,
            fats: 0,
            calories: 0,
            meals: []
          });
        }
      });
      
      return nutritionData;
    } catch (error) {
      console.error('Error fetching weekly nutrition:', error);
      return [];
    }
  }

  async getWeeklyWater(userId, startDate, endDate) {
    try {
      const waterData = [];
      const dailyLogsRef = collection(db, 'users', userId, 'dailyLogs');
      
      const q = query(
        dailyLogsRef,
        where('date', '>=', format(startDate, 'yyyy-MM-dd')),
        where('date', '<=', format(endDate, 'yyyy-MM-dd')),
        orderBy('date')
      );
      
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        waterData.push({
          date: data.date,
          intake: data.water || 0
        });
      });
      
      return waterData;
    } catch (error) {
      console.error('Error fetching weekly water data:', error);
      return [];
    }
  }

  async getWeeklyWeights(userId, startDate, endDate) {
    try {
      const weightData = [];
      const dailyLogsRef = collection(db, 'users', userId, 'dailyLogs');
      
      const q = query(
        dailyLogsRef,
        where('date', '>=', format(startDate, 'yyyy-MM-dd')),
        where('date', '<=', format(endDate, 'yyyy-MM-dd')),
        orderBy('date')
      );
      
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.weight) {
          weightData.push({
            date: data.date,
            weight: data.weight
          });
        }
      });
      
      // If no weights this week, get the most recent weight
      if (weightData.length === 0) {
        const profileDoc = await getDoc(doc(db, 'users', userId, 'profile', 'data'));
        if (profileDoc.exists()) {
          const profile = profileDoc.data();
          weightData.push({
            date: format(startDate, 'yyyy-MM-dd'),
            weight: profile.currentWeight || 75
          });
        }
      }
      
      return weightData;
    } catch (error) {
      console.error('Error fetching weekly weights:', error);
      return [];
    }
  }

  async saveWeeklyReport(userId, weekStart, report) {
    try {
      const weekNumber = this.getWeekNumber(weekStart);
      const year = weekStart.getFullYear();
      const reportId = `${year}-W${weekNumber}`;
      
      const reportRef = doc(db, 'users', userId, 'weeklyReports', reportId);
      await setDoc(reportRef, {
        ...report,
        weekStart: format(weekStart, 'yyyy-MM-dd'),
        weekEnd: format(endOfWeek(weekStart), 'yyyy-MM-dd'),
        weekNumber,
        year,
        createdAt: new Date().toISOString()
      });
      
      return reportId;
    } catch (error) {
      console.error('Error saving weekly report:', error);
      throw error;
    }
  }

  async getPreviousReports(userId, limit = 5) {
    try {
      const reportsRef = collection(db, 'users', userId, 'weeklyReports');
      const q = query(reportsRef, orderBy('createdAt', 'desc'), limit(limit));
      
      const querySnapshot = await getDocs(q);
      const reports = [];
      
      querySnapshot.forEach((doc) => {
        reports.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return reports;
    } catch (error) {
      console.error('Error fetching previous reports:', error);
      return [];
    }
  }

  getWeekNumber(date) {
    const oneJan = new Date(date.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
    return Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
  }

  async getProgressData(userId, weeks = 4) {
    try {
      // Get data for multiple weeks for trend analysis
      const progressData = [];
      const currentWeek = startOfWeek(new Date());
      
      for (let i = 0; i < weeks; i++) {
        const weekStart = subDays(currentWeek, i * 7);
        const weekData = await this.getWeeklyData(userId, weekStart);
        progressData.unshift(weekData); // Add to beginning to maintain chronological order
      }
      
      return progressData;
    } catch (error) {
      console.error('Error fetching progress data:', error);
      return [];
    }
  }
}

export const dataService = new DataService();
export default dataService; 