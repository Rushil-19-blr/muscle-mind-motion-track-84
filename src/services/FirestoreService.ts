import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WorkoutPlan } from './GoogleAIService';

export interface UserData {
  name: string;
  age: string;
  height: string;
  weight: string;
  gender: string;
  bodyFat: string;
  muscleMass: string;
  dietStyle: string;
  dailyMeals: string;
  dailyCalories: string;
  proteinIntake: string;
  currentProgram: string;
  benchPress: string;
  squat: string;
  deadlift: string;
  overheadPress: string;
  pullUps: string;
  rows: string;
  primaryGoal: string;
  secondaryGoal: string;
  weeklyAvailability: string;
  preferredDays: string[];
  userId: string;
  additionalSpecs?: {
    injuries: string;
    medications: string;
    sleepHours: string;
    stressLevel: string;
    workoutTime: string;
    equipment: string;
    experience: string;
    motivation: string;
  };
}

export interface CompletedWorkout {
  id?: string;
  userId: string;
  workoutName: string;
  date: string; // ISO date string
  duration: number; // in minutes
  exercises: {
    name: string;
    sets: {
      reps: number;
      weight: number;
      restTime: number;
    }[];
    muscleGroups: string[];
  }[];
  totalVolume: number; // calculated total weight moved
  caloriesBurned?: number; // estimated calories burned
  createdAt: Date;
}

export class FirestoreService {
  async saveUserData(userId: string, userData: Omit<UserData, 'userId'>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { ...userData, userId });
  }

  async getUserData(userId: string): Promise<UserData | null> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    }
    return null;
  }

  async updateUserData(userId: string, updates: Partial<UserData>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  }

  async saveWorkoutPlan(userId: string, workoutPlan: WorkoutPlan): Promise<void> {
    const planRef = doc(db, 'workoutPlans', userId);
    await setDoc(planRef, { ...workoutPlan, userId });
  }

  async getWorkoutPlan(userId: string): Promise<WorkoutPlan | null> {
    const planRef = doc(db, 'workoutPlans', userId);
    const planSnap = await getDoc(planRef);
    
    if (planSnap.exists()) {
      const data = planSnap.data();
      // Remove userId from the returned data
      const { userId: _, ...workoutPlan } = data;
      return workoutPlan as WorkoutPlan;
    }
    return null;
  }

  async updateWorkoutPlan(userId: string, updates: Partial<WorkoutPlan>): Promise<void> {
    const planRef = doc(db, 'workoutPlans', userId);
    await updateDoc(planRef, updates);
  }

  async deleteWorkoutPlan(userId: string): Promise<void> {
    const planRef = doc(db, 'workoutPlans', userId);
    await deleteDoc(planRef);
  }

  async saveCompletedWorkout(workoutData: Omit<CompletedWorkout, 'id' | 'createdAt'>): Promise<void> {
    const workoutsRef = collection(db, 'completedWorkouts');
    await addDoc(workoutsRef, {
      ...workoutData,
      createdAt: new Date()
    });
  }

  async getCompletedWorkouts(userId: string, limitCount?: number): Promise<CompletedWorkout[]> {
    const workoutsRef = collection(db, 'completedWorkouts');
    let q = query(
      workoutsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as CompletedWorkout[];
  }

  async getTodaysCompletedWorkout(userId: string): Promise<CompletedWorkout | null> {
    const today = new Date().toISOString().split('T')[0];
    const workoutsRef = collection(db, 'completedWorkouts');
    const q = query(
      workoutsRef,
      where('userId', '==', userId),
      where('date', '==', today)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      } as CompletedWorkout;
    }
    return null;
  }

  async getWorkoutStats(userId: string): Promise<{
    totalWorkouts: number;
    thisMonthWorkouts: number;
    currentStreak: number;
    totalVolume: number;
    strengthProgress: { [exercise: string]: { current: number; progress: number; date: Date; progression: number[] } };
    muscleGroupStats: { [group: string]: number };
  }> {
    const workouts = await this.getCompletedWorkouts(userId);
    
    const now = new Date();
    const thisMonth = workouts.filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate.getMonth() === now.getMonth() && 
             workoutDate.getFullYear() === now.getFullYear();
    });

    // Calculate current streak
    let currentStreak = 0;
    const sortedDates = [...new Set(workouts.map(w => w.date))].sort().reverse();
    let expectedDate = new Date();
    
    for (const dateStr of sortedDates) {
      const workoutDate = new Date(dateStr);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      if (dateStr === expectedDateStr) {
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate total volume
    const totalVolume = workouts.reduce((sum, workout) => sum + workout.totalVolume, 0);

    // Calculate strength progress (track personal records with dates and progression)
    const strengthProgress: { [exercise: string]: { current: number; progress: number; date: Date; progression: number[] } } = {};
    
    // Sort workouts by date to track progression over time
    const sortedWorkouts = workouts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exercise.sets.length > 0) {
          const maxWeight = Math.max(...exercise.sets.map(set => set.weight));
          
          if (!strengthProgress[exercise.name]) {
            strengthProgress[exercise.name] = { 
              current: maxWeight, 
              progress: 0, 
              date: new Date(workout.date),
              progression: [maxWeight]
            };
          } else {
            const currentPR = strengthProgress[exercise.name];
            
            // Add to progression history
            if (currentPR.progression.length === 0 || maxWeight !== currentPR.progression[currentPR.progression.length - 1]) {
              currentPR.progression.push(maxWeight);
            }
            
            // Update personal record if this is a new max
            if (maxWeight > currentPR.current) {
              const oldWeight = currentPR.current;
              strengthProgress[exercise.name] = {
                current: maxWeight,
                progress: maxWeight - oldWeight,
                date: new Date(workout.date),
                progression: [...currentPR.progression.slice(-5), maxWeight] // Keep last 6 values for sparkline
              };
            }
          }
        }
      });
    });

    // Calculate muscle group stats
    const muscleGroupStats: { [group: string]: number } = {};
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        exercise.muscleGroups.forEach(group => {
          muscleGroupStats[group] = (muscleGroupStats[group] || 0) + exercise.sets.length;
        });
      });
    });

    return {
      totalWorkouts: workouts.length,
      thisMonthWorkouts: thisMonth.length,
      currentStreak,
      totalVolume,
      strengthProgress,
      muscleGroupStats
    };
  }
}

export const firestoreService = new FirestoreService();
