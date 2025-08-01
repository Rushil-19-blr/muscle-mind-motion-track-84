
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  TrendingUp, 
  Clock, 
  Dumbbell, 
  Target, 
  Play, 
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { firestoreService, UserData, CompletedWorkout } from '@/services/FirestoreService';
import { WorkoutPlan } from '@/services/GoogleAIService';
import { StreaksWidget } from '@/components/StreaksWidget';
import { CaloriesBurnedWidget } from '@/components/CaloriesBurnedWidget';
import { PRViewerWidget } from '@/components/PRViewerWidget';
import { DailyChallengeWidget } from '@/components/DailyChallengeWidget';
import { MoodBoosterWidget } from '@/components/MoodBoosterWidget';
import { QuickThemeToggle } from '@/components/QuickThemeToggle';
import { calorieEstimationService } from '@/services/CalorieEstimationService';
import { VoiceRexChatbot } from '@/components/VoiceRexChatbot';

interface DashboardProps {
  onStartWorkout?: () => void;
  onModifySchedule?: () => void;
  onViewPlan?: () => void;
}

const CircularProgress = ({ percentage }: { percentage: number }) => {
  const circumference = 2 * Math.PI * 50; // radius of 50
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
        {/* Background circle */}
        <circle
          cx="60"
          cy="60"
          r="50"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx="60"
          cy="60"
          r="50"
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-primary transition-all duration-1000 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{percentage}%</span>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ 
  onStartWorkout,
  onModifySchedule,
  onViewPlan 
}) => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [todaysWorkout, setTodaysWorkout] = useState<CompletedWorkout | null>(null);
  const [workoutStats, setWorkoutStats] = useState<any>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<CompletedWorkout[]>([]);
  const [todaysCalories, setTodaysCalories] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Get today's workout plan
  const getTodaysWorkoutPlan = () => {
    if (!workoutPlan) return null;
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    console.log('Today is:', today);
    console.log('Available workout days:', workoutPlan.days.map(d => d.day));
    
    return workoutPlan.days.find(day => {
      const planDay = day.day.toLowerCase().trim();
      const todayLower = today.toLowerCase().trim();
      
      // Direct match
      if (planDay === todayLower) return true;
      
      // Check if plan day contains today or vice versa
      if (planDay.includes(todayLower) || todayLower.includes(planDay)) return true;
      
      return false;
    });
  };

  const todaysWorkoutPlan = getTodaysWorkoutPlan();

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const [userDataResponse, workoutPlanResponse, todaysWorkoutResponse, statsResponse, recentWorkoutsResponse] = await Promise.all([
            firestoreService.getUserData(user.uid),
            firestoreService.getWorkoutPlan(user.uid),
            firestoreService.getTodaysCompletedWorkout(user.uid),
            firestoreService.getWorkoutStats(user.uid),
            firestoreService.getCompletedWorkouts(user.uid, 14)
          ]);
          
          setUserData(userDataResponse);
          setWorkoutPlan(workoutPlanResponse);
          setTodaysWorkout(todaysWorkoutResponse);
          setWorkoutStats(statsResponse);
          setRecentWorkouts(recentWorkoutsResponse);

          // Calculate today's calories if workout was completed
          if (todaysWorkoutResponse && userDataResponse) {
            try {
              const calories = await calorieEstimationService.estimateCaloriesBurned({
                duration: todaysWorkoutResponse.duration,
                exercises: todaysWorkoutResponse.exercises,
                totalVolume: todaysWorkoutResponse.totalVolume,
                userWeight: userDataResponse.weight ? parseFloat(userDataResponse.weight) : 70,
                userAge: userDataResponse.age ? parseInt(userDataResponse.age) : 30,
                userGender: userDataResponse.gender || 'male'
              });
              setTodaysCalories(calories);
            } catch (error) {
              console.error('Error calculating calories:', error);
              setTodaysCalories(0);
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserData();
  }, [user]);

  // Calculate statistics from real data
  const calculateStats = () => {
    if (!workoutPlan) {
      return {
        totalExercises: 0,
        avgDuration: 0,
        programDuration: 'N/A',
        consistency: 0
      };
    }

    const totalExercises = workoutPlan.days.reduce((total, day) => total + day.exercises.length, 0);
    const avgDuration = workoutPlan.days.reduce((total, day) => total + day.duration, 0) / workoutPlan.days.length;
    const programDuration = workoutPlan.duration;
    // For now, consistency is a placeholder - you'd calculate this based on workout history
    const consistency = 85;

    return {
      totalExercises,
      avgDuration: Math.round(avgDuration),
      programDuration,
      consistency
    };
  };

  const stats = calculateStats();
  const userName = userData?.name || user?.email?.split('@')[0] || 'User';
  const userGoals = userData ? [userData.primaryGoal, userData.secondaryGoal].filter(Boolean) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background ml-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-2 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header with Theme Toggle - Mobile Optimized */}
        <div className="text-center mb-6 sm:mb-8 relative px-2">
          <div className="absolute top-0 right-0">
            <QuickThemeToggle />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 pr-12">
            Welcome back, <span className="text-primary">{userName}</span>!
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            Ready to crush your fitness goals today?
          </p>
        </div>

        {/* Reordered Widgets - Vertical Stack with Proper Spacing */}
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 mt-4 sm:mt-6 mb-6 sm:mb-8">
          {/* 1. Start Workout */}
          <Card className="p-4 sm:p-6 md:p-8 bg-glass/30 backdrop-blur-glass border-glass-border">
            {todaysWorkout ? (
              // Workout already completed today
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-success/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-success" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-success mb-2">Workout Complete! 🎉</h3>
                <p className="text-success/80 mb-4">
                  You crushed today's {todaysWorkout.workoutName} session!
                </p>
                <p className="text-sm text-muted-foreground">
                  {todaysWorkout.duration} minutes • {todaysWorkout.totalVolume.toFixed(0)}kg total volume
                </p>
                <div className="mt-4 text-xs text-muted-foreground">
                  Completed at {new Date(todaysWorkout.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ) : todaysWorkoutPlan ? (
              // Workout available but not completed
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Today's Workout</h3>
                <p className="text-lg font-medium text-primary mb-2">{todaysWorkoutPlan.name}</p>
                <p className="text-muted-foreground mb-4">
                  {todaysWorkoutPlan.exercises.length} exercises • {todaysWorkoutPlan.duration} minutes
                </p>
                <Button 
                  size="lg" 
                  onClick={onStartWorkout}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 text-base font-medium rounded-full"
                >
                  Start Workout
                </Button>
              </div>
            ) : (
              // Rest day
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 bg-muted/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Rest Day</h3>
                <p className="text-muted-foreground">
                  Take time to recover and come back stronger tomorrow! 
                </p>
              </div>
            )}
          </Card>

          {/* 2. Streak Tracker */}
          <StreaksWidget 
            streakData={recentWorkouts.map(workout => ({
              date: new Date(workout.date),
              completed: true,
              workoutName: workout.workoutName,
              isRestDay: false
            }))} 
          />

          {/* 3. Calories Burnt */}
          <CaloriesBurnedWidget caloriesBurned={todaysCalories || 0} />

          {/* 4. Motivation (Daily Challenge & Mood Booster) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DailyChallengeWidget />
            <MoodBoosterWidget />
          </div>

          {/* 5. Personal Records */}
          <PRViewerWidget 
            personalRecords={workoutStats?.strengthProgress ? Object.entries(workoutStats.strengthProgress).map(([exercise, data]: [string, any]) => ({
              exercise,
              weight: data.current,
              reps: 1,
              date: data.date,
              progression: data.progression.length >= 6 ? data.progression : [...Array(6 - data.progression.length).fill(data.current - 10), ...data.progression]
            })) : []} 
          />
        </div>

        {/* Voice Rex Chatbot */}
        <VoiceRexChatbot 
          userData={userData}
          workoutPlan={workoutPlan}
          isWorkoutMode={false}
          onPlanModified={(modifiedPlan) => {
            setWorkoutPlan(modifiedPlan);
            // Save to Firestore
            if (user) {
              firestoreService.updateWorkoutPlan(user.uid, modifiedPlan);
            }
          }}
        />

      </div>
    </div>
  );
};

export default Dashboard;
