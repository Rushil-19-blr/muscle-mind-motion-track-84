import { GoogleAIService } from './GoogleAIService';
import { CompletedWorkout } from './FirestoreService';

export interface CalorieEstimationData {
  duration: number; // workout duration in minutes
  exercises: {
    name: string;
    sets: { reps: number; weight: number; restTime: number }[];
    muscleGroups: string[];
  }[];
  totalVolume: number;
  userWeight?: number;
  userAge?: number;
  userGender?: string;
}

export class CalorieEstimationService {
  private aiService: GoogleAIService;

  constructor() {
    this.aiService = new GoogleAIService();
  }

  async estimateCaloriesBurned(data: CalorieEstimationData): Promise<number> {
    const { duration, exercises, totalVolume, userWeight = 70, userAge = 30, userGender = 'male' } = data;

    // Create a detailed prompt for AI to estimate calories
    const prompt = `
As a fitness expert, estimate the calories burned for this workout session. Be precise and realistic.

User Information:
- Weight: ${userWeight}kg
- Age: ${userAge} years
- Gender: ${userGender}

Workout Details:
- Duration: ${duration} minutes
- Total Volume: ${totalVolume}kg
- Exercises performed: ${exercises.length}

Exercise Breakdown:
${exercises.map(exercise => `
- ${exercise.name}: ${exercise.sets.length} sets
  - Muscle Groups: ${exercise.muscleGroups.join(', ')}
  - Average weight per set: ${exercise.sets.reduce((sum, set) => sum + set.weight, 0) / exercise.sets.length}kg
  - Total reps: ${exercise.sets.reduce((sum, set) => sum + set.reps, 0)}
  - Total volume for this exercise: ${exercise.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0)}kg
`).join('')}

Consider these factors:
1. Muscle groups worked (compound movements burn more calories)
2. Workout intensity (based on weight lifted vs body weight)
3. Rest periods between sets
4. Total workout duration
5. User's metabolic factors (age, weight, gender)

Provide ONLY a single number representing the estimated calories burned. No explanation, just the number.
`;

    try {
      const result = await this.aiService.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const caloriesText = text.replace(/[^\d]/g, ''); // Extract only numbers
      const calories = parseInt(caloriesText);
      
      // Sanity check: ensure calories are within reasonable range
      if (isNaN(calories) || calories < 50 || calories > 1500) {
        // Fallback calculation based on simple formula
        return this.fallbackCalorieCalculation(duration, totalVolume, userWeight);
      }
      
      return calories;
    } catch (error) {
      console.error('Error estimating calories with AI:', error);
      // Fallback to simple calculation
      return this.fallbackCalorieCalculation(duration, totalVolume, userWeight);
    }
  }

  private fallbackCalorieCalculation(duration: number, totalVolume: number, userWeight: number): number {
    // Simple fallback calculation
    // Base metabolic rate per minute for strength training: ~5-8 calories per minute per kg
    const baseRate = 6; // calories per minute per kg
    const intensityMultiplier = Math.min(totalVolume / (userWeight * 100), 2); // Cap at 2x
    
    return Math.round(duration * baseRate * (userWeight / 70) * (1 + intensityMultiplier));
  }
}

export const calorieEstimationService = new CalorieEstimationService();