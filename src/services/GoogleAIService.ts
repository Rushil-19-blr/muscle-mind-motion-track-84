import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyCOM7OWHcRNoz_FFyLQ8QrM8WNbfClFLU8';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface WorkoutPlan {
  id: string;
  name: string;
  duration: string;
  days: WorkoutDay[];
  goals: string[];
  notes: string;
}

export interface WorkoutDay {
  day: string;
  name: string;
  exercises: Exercise[];
  duration: number;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight: string;
  restTime: string;
  notes: string;
  muscleGroups: string[];
}

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
  additionalSpecs?: any;
}

export class GoogleAIService {
  public model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  async generateWorkoutPlan(userData: UserData): Promise<WorkoutPlan> {
    const prompt = `
      You are a professional fitness trainer and exercise physiologist. Create a detailed, personalized workout plan for a user with the following profile. The plan should be scientifically sound, progressive, and tailored to their specific goals and current fitness level.
      
      Personal Info:
      - Name: ${userData.name}
      - Age: ${userData.age}
      - Height: ${userData.height}
      - Weight: ${userData.weight}
      - Gender: ${userData.gender}
      - Body Fat: ${userData.bodyFat}%
      - Muscle Mass: ${userData.muscleMass}
      
      Fitness Info:
      - Primary Goal: ${userData.primaryGoal}
      - Secondary Goal: ${userData.secondaryGoal}
      - Weekly Availability: ${userData.weeklyAvailability}
      - Preferred Days: ${userData.preferredDays.join(', ')}
      
      Current Strength Levels:
      - Bench Press: ${userData.benchPress}
      - Squat: ${userData.squat}
      - Deadlift: ${userData.deadlift}
      - Overhead Press: ${userData.overheadPress}
      - Pull-ups: ${userData.pullUps}
      - Rows: ${userData.rows}
      
      Diet Info:
      - Diet Style: ${userData.dietStyle}
      - Daily Meals: ${userData.dailyMeals}
      - Daily Calories: ${userData.dailyCalories}
      - Protein Intake: ${userData.proteinIntake}g
      
      Current Program: ${userData.currentProgram}
      
      ${userData.additionalSpecs ? `
      Additional Specifications:
      - Injuries/Limitations: ${userData.additionalSpecs.injuries || 'None specified'}
      - Medications: ${userData.additionalSpecs.medications || 'None specified'}
      - Sleep Hours: ${userData.additionalSpecs.sleepHours || 'Not specified'}
      - Stress Level: ${userData.additionalSpecs.stressLevel || 'Not specified'}/10
      - Preferred Workout Time: ${userData.additionalSpecs.workoutTime || 'Not specified'}
      - Available Equipment: ${userData.additionalSpecs.equipment || 'Standard gym equipment'}
      - Training Experience: ${userData.additionalSpecs.experience || 'Not specified'}
      - Motivation: ${userData.additionalSpecs.motivation || 'General fitness improvement'}
      ` : ''}
      
      IMPORTANT: You must respond with ONLY a valid JSON object, no additional text or formatting. The JSON should follow this exact structure:
      
      {
        "name": "Descriptive Plan Name",
        "duration": "4-6 weeks", 
        "days": [
          {
            "day": "Monday",
            "name": "Workout Name",
            "exercises": [
              {
                "name": "Exercise Name",
                "sets": 4,
                "reps": "6-8",
                "weight": "suggested weight or bodyweight",
                "restTime": "2-3 minutes",
                "notes": "Form cues and tips",
                "muscleGroups": ["primary", "secondary"]
              }
            ],
            "duration": 45
          }
        ],
        "goals": ["primary goal", "secondary goal"],
        "notes": "Important program notes and progression guidelines"
      }
      
      Create a plan with ${userData.weeklyAvailability} training days per week. Focus on ${userData.primaryGoal} as the primary goal. Include compound movements, proper progression, and consider their current strength levels. Make the plan challenging but achievable.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('AI Response:', text);
      
      // Clean the response and extract JSON
      let cleanedText = text.trim();
      
      // Remove any markdown formatting
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find the JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        const planData = JSON.parse(jsonString);
        
        // Validate the structure
        if (!planData.name || !planData.days || !Array.isArray(planData.days)) {
          throw new Error('Invalid plan structure');
        }
        
        return {
          id: `plan-${Date.now()}`,
          ...planData
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error generating workout plan:', error);
      return this.getFallbackPlan(userData);
    }
  }

  async adaptWorkoutPlan(currentPlan: WorkoutPlan, modifications: string): Promise<WorkoutPlan> {
    const prompt = `
      You are a professional fitness trainer. Modify the following workout plan based on the user's feedback. Respond with ONLY a valid JSON object in the same format as the original plan.
      
      Current Plan: ${JSON.stringify(currentPlan)}
      
      User Modifications: ${modifications}
      
      Make the requested changes while maintaining the scientific integrity of the program. Ensure proper exercise selection, volume, and progression.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('AI Modification Response:', text);
      
      // Clean the response
      let cleanedText = text.trim();
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        const planData = JSON.parse(jsonString);
        return {
          ...currentPlan,
          ...planData,
          id: `plan-${Date.now()}`
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error adapting workout plan:', error);
      return currentPlan;
    }
  }

  private getFallbackPlan(userData: UserData): WorkoutPlan {
    return {
      id: `fallback-${Date.now()}`,
      name: `${userData.primaryGoal} Program for ${userData.name}`,
      duration: "4-6 weeks",
      days: [
        {
          day: "Monday",
          name: "Upper Body Strength",
          exercises: [
            {
              name: "Bench Press",
              sets: 4,
              reps: "8-10",
              weight: userData.benchPress ? `${Math.round(parseFloat(userData.benchPress) * 0.7)}kg` : "Start light",
              restTime: "2-3 minutes",
              notes: "Focus on controlled movement and full range of motion",
              muscleGroups: ["chest", "triceps", "shoulders"]
            },
            {
              name: "Barbell Rows",
              sets: 3,
              reps: "8-10",
              weight: userData.rows ? `${Math.round(parseFloat(userData.rows) * 0.8)}kg` : "Moderate weight",
              restTime: "2 minutes",
              notes: "Pull to lower chest, squeeze shoulder blades together",
              muscleGroups: ["back", "biceps"]
            },
            {
              name: "Overhead Press",
              sets: 3,
              reps: "6-8",
              weight: userData.overheadPress ? `${Math.round(parseFloat(userData.overheadPress) * 0.8)}kg` : "Start light",
              restTime: "2-3 minutes",
              notes: "Keep core tight, press straight up",
              muscleGroups: ["shoulders", "triceps", "core"]
            }
          ],
          duration: 60
        },
        {
          day: "Wednesday",
          name: "Lower Body Power",
          exercises: [
            {
              name: "Squats",
              sets: 4,
              reps: "8-10",
              weight: userData.squat ? `${Math.round(parseFloat(userData.squat) * 0.7)}kg` : "Start with bodyweight",
              restTime: "2-3 minutes",
              notes: "Descend until thighs are parallel to floor",
              muscleGroups: ["quads", "glutes", "hamstrings"]
            },
            {
              name: "Deadlifts",
              sets: 3,
              reps: "5-8",
              weight: userData.deadlift ? `${Math.round(parseFloat(userData.deadlift) * 0.7)}kg` : "Start moderate",
              restTime: "3 minutes",
              notes: "Keep back neutral, drive through heels",
              muscleGroups: ["hamstrings", "glutes", "back"]
            },
            {
              name: "Walking Lunges",
              sets: 3,
              reps: "12 each leg",
              weight: "Bodyweight or light dumbbells",
              restTime: "90 seconds",
              notes: "Step forward into lunge, alternate legs",
              muscleGroups: ["quads", "glutes", "calves"]
            }
          ],
          duration: 55
        },
        {
          day: "Friday",
          name: "Full Body Circuit",
          exercises: [
            {
              name: "Pull-ups",
              sets: 3,
              reps: userData.pullUps ? userData.pullUps : "5-8",
              weight: "Bodyweight",
              restTime: "2 minutes",
              notes: "Use assistance if needed, focus on full range",
              muscleGroups: ["lats", "rhomboids", "biceps"]
            },
            {
              name: "Push-ups",
              sets: 3,
              reps: "10-15",
              weight: "Bodyweight",
              restTime: "90 seconds",
              notes: "Maintain straight body line",
              muscleGroups: ["chest", "triceps", "shoulders"]
            },
            {
              name: "Plank",
              sets: 3,
              reps: "30-60 seconds",
              weight: "Bodyweight",
              restTime: "60 seconds",
              notes: "Keep body straight, engage core",
              muscleGroups: ["core", "shoulders"]
            }
          ],
          duration: 40
        }
      ],
      goals: [userData.primaryGoal, userData.secondaryGoal].filter(Boolean),
      notes: `Progressive overload program designed for ${userData.primaryGoal}. Increase weight by 2.5-5kg when you can complete all sets and reps with good form. Rest 48-72 hours between sessions. Focus on proper form over heavy weight.`
    };
  }
}

export const googleAIService = new GoogleAIService();
