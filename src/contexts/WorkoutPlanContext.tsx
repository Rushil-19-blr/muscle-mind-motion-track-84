import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WorkoutPlan } from '@/services/GoogleAIService';

interface WorkoutPlanContextType {
  workoutPlan: WorkoutPlan | null;
  setWorkoutPlan: (plan: WorkoutPlan | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  pendingPlan: WorkoutPlan | null;
  setPendingPlan: (plan: WorkoutPlan | null) => void;
}

const WorkoutPlanContext = createContext<WorkoutPlanContextType | undefined>(undefined);

export const useWorkoutPlan = () => {
  const context = useContext(WorkoutPlanContext);
  if (!context) {
    throw new Error('useWorkoutPlan must be used within a WorkoutPlanProvider');
  }
  return context;
};

interface WorkoutPlanProviderProps {
  children: ReactNode;
}

export const WorkoutPlanProvider: React.FC<WorkoutPlanProviderProps> = ({ children }) => {
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<WorkoutPlan | null>(null);

  return (
    <WorkoutPlanContext.Provider
      value={{
        workoutPlan,
        setWorkoutPlan,
        isLoading,
        setIsLoading,
        pendingPlan,
        setPendingPlan,
      }}
    >
      {children}
    </WorkoutPlanContext.Provider>
  );
};