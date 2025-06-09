# FitTrackAI: Fitness & Nutrition Tracking App

FitTrackAI is a comprehensive web-based fitness and nutrition tracking application designed to help users achieve a gym physique with defined abs, strong shoulders, and arms. This offers seamless authentication, detailed progress tracking, and AI-powered insights.

![FitTrackAI Landing Page](https://via.placeholder.com/800x400/3b82f6/ffffff?text=FitTrackAI)

## 🎯 Purpose

Empowers users to:
- Track nutrition and macros (protein, carbs, fats) from staple foods and supplements
- Log gym workouts (weights lifted, machines used) and activities (swimming)
- Monitor water intake and body metrics (weight, height)
- Follow and edit personalized weekly schedules
- Mark daily accomplishments for accountability
- Receive AI-driven insights on weekly progress to optimize muscle gain and fat loss

## ✨ Key Features

### 🔐 Authentication
- **Google OAuth**: Secure sign-in via Google using Firebase Authentication
- **Email/Password**: Traditional registration and login with password reset
- **User Profiles**: Store name, height, weight, and optional profile photos

### 📅 Weekly Schedule Management
- **Initial Setup**: Configure weekly schedules on first login
- **Editable Plans**: Update exercises, meals, and goals anytime
- **Comprehensive Tracking**: Gym workouts, swimming, nutrition plans, water goals

### 📊 Daily Tracking
- **Nutrition Logging**: Track meals with automatic macro calculation
- **Workout Logging**: Log exercises, sets, reps, weights, and machines
- **Water Tracking**: Monitor daily hydration with goal achievement
- **Progress Marking**: Checkbox system for daily accomplishments

### 📈 Progress Visualization
- **Interactive Charts**: Weight trends, macro breakdowns, workout progress
- **Weekly Overview**: Visual progress tracking with completion markers
- **Body Metrics**: Track measurements and progress photos
- **Export Options**: Download data as CSV or PDF

### 🤖 AI Analysis (Planned)
- **Weekly Reports**: AI-generated performance summaries
- **Smart Recommendations**: Personalized optimization suggestions
- **Trend Analysis**: Identify patterns and improvement opportunities

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Chart.js + React-ChartJS-2
- **Forms**: React Hook Form
- **Routing**: React Router DOM
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Profile Photos**: UI Avatars & Google Photos (via OAuth)
- **Notifications**: React Hot Toast

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project (only Authentication and Firestore needed - both free!)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FitTrackAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```
   
   **Note**: You only need Authentication and Firestore enabled in Firebase (both free). Storage bucket URL is required in config but we don't use Firebase Storage.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📱 Application Structure

```
src/
├── components/
│   ├── charts/
│   │   ├── WeightChart.jsx
│   │   └── MacroChart.jsx
│   └── tracking/
│       ├── WorkoutLogger.jsx
│       ├── NutritionLogger.jsx
│       └── WaterTracker.jsx
├── contexts/
│   └── AuthContext.jsx
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── SignUp.jsx
│   ├── Dashboard.jsx
│   └── Home.jsx
├── routes/
│   └── AppRoutes.jsx
├── config/
│   └── firebase.js
└── main.jsx
```

## 🔥 Firebase Setup (Free Tier Only!)

**Required Services** (All Free):
1. **Authentication**: Google OAuth + Email/Password
2. **Firestore Database**: User data and tracking logs

**NOT Required**:
- ❌ Firebase Storage (not free)
- ❌ Firebase Hosting (optional)
- ❌ Cloud Functions (optional for AI features)

### Profile Photos Solution
Instead of Firebase Storage, we use:
- **Google Photos**: Automatically from Google OAuth
- **UI Avatars**: Free service for generated avatars
- **Gravatar**: Based on email hash (future enhancement)

## 🔥 Firebase Firestore Structure

```
users/{uid}/
├── profile/
│   └── data/
│       ├── displayName
│       ├── email
│       ├── height
│       ├── currentWeight
│       └── photoURL (from Google OAuth)
├── schedules/
│   └── {YYYY-MM-DD}/        # Week-specific schedules (Monday date of week)
│       ├── Monday: []       # Array of tasks for Monday
│       ├── Tuesday: []      # Array of tasks for Tuesday
│       ├── Wednesday: []    # Array of tasks for Wednesday
│       ├── Thursday: []     # Array of tasks for Thursday
│       ├── Friday: []       # Array of tasks for Friday
│       ├── Saturday: []     # Array of tasks for Saturday
│       └── Sunday: []       # Array of tasks for Sunday
├── dailyLogs/
│   └── {YYYY-MM-DD}/        # Daily activity logs
│       ├── workouts: []     # Array of completed workouts
│       ├── meals: []        # Array of logged meals  
│       ├── water: number    # Water intake in ml
│       └── weight: number   # Body weight in kg
└── weeklyReports/ (future AI feature)
    └── {week}/
        ├── summary
        ├── recommendations
        └── metrics
```

**Key Features:**
- 🔄 **Real-time sync** across all devices
- ☁️ **Cloud-only storage** - no localStorage dependencies  
- 📅 **Date-based organization** for easy querying
- 🔗 **Automatic sync** between schedules and daily logs

## 🎨 Key Components

### Dashboard
- Main interface with sidebar navigation
- Overview with stats, charts, and quick actions
- Responsive design for mobile and desktop

### Workout Logger
- Exercise tracking with sets, reps, weights
- Machine/equipment selection
- Progress marking and completion tracking

### Nutrition Logger
- Pre-populated food database with macros
- Meal type categorization
- Daily nutrition summary with goals

### Charts
- Weight progress visualization
- Macro breakdown (protein, carbs, fats)
- Interactive tooltips and responsive design

## 🥗 Nutrition Database

Pre-loaded with common foods:
- **Protein Sources**: Chicken, eggs, protein powder, Greek yogurt
- **Carbohydrates**: Oats, rice, sweet potatoes, pasta
- **Healthy Fats**: Almonds, avocado, olive oil
- **Supplements**: Creatine, whey protein, BCAAs
- **Dairy**: Milk, cheese, cottage cheese

## 🏋️ Workout Categories

- Push Day (Chest, Shoulders, Triceps)
- Pull Day (Back, Biceps)
- Leg Day
- Cardio & Swimming
- Recovery/Stretching

## 🔧 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## 📦 Deployment

The application can be deployed to various platforms:

- **Vercel**: `npm run build` and deploy the `dist` folder
- **Netlify**: Connect your repository and set build command to `npm run build`
- **Firebase Hosting**: Use Firebase CLI to deploy

## 🎯 Fitness Goals Example

For a 5'11" (180cm), 75kg user aiming for muscle gain:
- **Protein**: 150-160g daily (2g per kg body weight)
- **Water**: 4L daily
- **Workouts**: 4-5 sessions per week
- **Supplements**: 5g creatine daily

## 🔮 Future Enhancements

- [ ] AI-powered weekly analysis via DeepSeek API
- [ ] Progress photo comparison
- [ ] Meal planning and prep suggestions
- [ ] Integration with fitness wearables
- [ ] Social features and community challenges
- [ ] Advanced analytics and trend prediction
- [ ] Mobile app development

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support, email support@fittrack-ai.com or join our community Discord.

## 🔧 Troubleshooting

### Data Not Syncing Between Devices

The app now uses **pure Firebase Firestore** for all data storage, ensuring seamless synchronization across all devices. No localStorage dependencies!

**To verify sync is working:**

1. **Log out and log back in** on both devices to ensure fresh authentication
2. **Add a workout, meal, or schedule task** on one device
3. **Check if it appears immediately** on the other device (should be instant)
4. **Refresh the page** if needed to trigger a data reload

**Data Storage (Firebase Only):**
- ✅ **User Profile**: `users/{uid}/profile/data`
- ✅ **Daily Logs**: `users/{uid}/dailyLogs/{YYYY-MM-DD}`  
- ✅ **Weekly Schedules**: `users/{uid}/schedules/{YYYY-MM-DD}`
- ❌ **localStorage**: Completely removed for clean multi-device sync

**All Features Work Across Devices:**
- ✅ **Schedule Management**: Add, edit, delete, move tasks
- ✅ **Task Editing**: Click edit button to modify existing tasks
- ✅ **Rich Task Display**: Shows reps, calories, descriptions, and notes separately
- ✅ **Copy/Paste Days**: Copy tasks from one day to another (📋/📥 buttons)
- ✅ **Copy/Paste Weeks**: Copy schedules between different weeks
- ✅ **Workout/Nutrition Sync**: Automatic bidirectional sync
- ✅ **Task Completion**: Mark tasks as complete/incomplete
- ✅ **Progress Tracking**: View data from any device
- ✅ **Clean Interface**: Simplified layout with better organization

If you still experience sync issues:
1. Check your internet connection
2. Verify Firebase configuration in `.env` file
3. Check browser console for any errors
4. Ensure you're logged in with the same Google account on both devices

---

**Built with ❤️ for fitness enthusiasts who take their training seriously.**