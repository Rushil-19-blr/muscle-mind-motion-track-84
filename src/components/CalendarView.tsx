import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ChevronLeft, ChevronRight, Dumbbell, Clock, CheckCircle2 } from 'lucide-react';
import { WorkoutPlan } from '@/services/GoogleAIService';
import { useAuth } from '@/hooks/useAuth';
import { firestoreService, CompletedWorkout } from '@/services/FirestoreService';
import { DailyWorkoutDialog } from '@/components/DailyWorkoutDialog';

interface CalendarViewProps {
  workoutPlan: WorkoutPlan | null;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ workoutPlan }) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkout[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Load completed workouts
  useEffect(() => {
    const loadCompletedWorkouts = async () => {
      if (user) {
        try {
          console.log('Loading completed workouts for user:', user.uid);
          const workouts = await firestoreService.getCompletedWorkouts(user.uid);
          console.log('Loaded completed workouts:', workouts);
          setCompletedWorkouts(workouts);
        } catch (error) {
          console.error('Error loading completed workouts:', error);
        }
      }
    };

    loadCompletedWorkouts();
  }, [user]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getWorkoutForDay = (dayName: string) => {
    if (!workoutPlan) return null;
    
    const normalizedDayName = dayName.toLowerCase().trim();
    
    return workoutPlan.days.find(day => {
      const planDay = day.day.toLowerCase().trim();
      
      if (planDay === normalizedDayName) return true;
      if (planDay.includes(normalizedDayName) || normalizedDayName.includes(planDay)) return true;
      
      const dayMappings = {
        'sun': 'sunday',
        'mon': 'monday', 
        'tue': 'tuesday',
        'wed': 'wednesday',
        'thu': 'thursday',
        'fri': 'friday',
        'sat': 'saturday'
      };
      
      const expandedCalendarDay = dayMappings[normalizedDayName] || normalizedDayName;
      const expandedPlanDay = dayMappings[planDay] || planDay;
      
      return expandedCalendarDay === expandedPlanDay;
    });
  };

  const getWorkoutType = (workout: any) => {
    if (!workout) return 'rest';
    
    const name = workout.name.toLowerCase();
    if (name.includes('push') || name.includes('chest') || name.includes('shoulder')) return 'push';
    if (name.includes('pull') || name.includes('back') || name.includes('lat')) return 'pull';
    if (name.includes('leg') || name.includes('squat') || name.includes('lower')) return 'legs';
    if (name.includes('cardio') || name.includes('running') || name.includes('bike')) return 'cardio';
    if (name.includes('full') || name.includes('total')) return 'fullbody';
    return 'fullbody';
  };

  const isWorkoutCompleted = (date: Date) => {
    // Use local date format to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    console.log('Checking completion for date:', dateString);
    console.log('Available completed workouts:', completedWorkouts.map(w => w.date));
    const isCompleted = completedWorkouts.some(workout => workout.date === dateString);
    console.log('Is completed:', isCompleted);
    return isCompleted;
  };

  const getCompletedWorkoutForDate = (date: Date): CompletedWorkout | null => {
    // Use local date format to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    const completed = completedWorkouts.find(workout => workout.date === dateString) || null;
    console.log('Getting completed workout for', dateString, ':', completed);
    return completed;
  };

  const getWorkoutGradient = (type: string) => {
    switch (type) {
      case 'push': 
        return 'bg-gradient-to-br from-orange-400 to-red-600'; // Upper Body - Orange to Deep Red
      case 'pull': 
        return 'bg-gradient-to-br from-blue-400 to-indigo-600'; // Pull - Blue to Indigo  
      case 'legs': 
        return 'bg-gradient-to-br from-purple-400 to-purple-700'; // Lower Body - Purple to Plum
      case 'cardio': 
        return 'bg-gradient-to-br from-red-400 to-pink-600'; // Cardio - Red to Pink
      case 'fullbody': 
        return 'bg-gradient-to-br from-teal-400 to-indigo-600'; // Full Body - Teal to Indigo
      default: 
        return 'bg-gradient-to-br from-gray-300 to-gray-400'; // Rest/Recovery - Light Grey
    }
  };

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'push': return 'bg-destructive';
      case 'pull': return 'bg-primary';
      case 'legs': return 'bg-success';
      case 'cardio': return 'bg-warning';
      case 'fullbody': return 'bg-secondary';
      default: return 'bg-muted';
    }
  };

  const getWorkoutTypeLabel = (type: string) => {
    switch (type) {
      case 'push': return 'Push';
      case 'pull': return 'Pull';
      case 'legs': return 'Legs';
      case 'cardio': return 'Cardio';
      case 'fullbody': return 'Full Body';
      default: return 'Rest';
    }
  };

  const handleDayClick = (date: Date) => {
    console.log('Clicked on date:', date);
    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayName = daysOfWeek[date.getDay()];
      const workout = getWorkoutForDay(dayName);
      
      const workoutType = getWorkoutType(workout);
      const typeColor = getWorkoutTypeColor(workoutType);
      const typeLabel = getWorkoutTypeLabel(workoutType);
      const isToday = date.toDateString() === new Date().toDateString();
      const isCompleted = isWorkoutCompleted(date);

      console.log(`Day ${day}: workout type=${workoutType}, isCompleted=${isCompleted}`);

      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(date)}
          className={`h-24 p-2 border-0 cursor-pointer transition-all duration-300 ${
            isToday ? 'scale-105' : 'hover:scale-102'
          } active:scale-95`}
        >
          <div className="h-full flex items-center justify-center relative">
            {workout ? (
              <div className={`
                w-16 h-16 rounded-3xl flex items-center justify-center relative overflow-hidden backdrop-blur-md border border-white/20
                shadow-lg hover:shadow-xl transition-all duration-300
                ${getWorkoutGradient(workoutType)}
              `}>
                {/* Day number */}
                <span className="text-2xl font-bold text-white drop-shadow-md">
                  {day}
                </span>
                
                {/* Completion indicator */}
                {isCompleted && (
                  <div className="absolute -top-1 -right-1">
                    <CheckCircle2 className="w-5 h-5 text-green-400 bg-white rounded-full drop-shadow-sm" />
                  </div>
                )}
                
                {/* Today indicator */}
                {isToday && (
                  <div className="absolute inset-0 rounded-3xl ring-2 ring-white/50 ring-offset-2 ring-offset-transparent"></div>
                )}
              </div>
            ) : (
              <div className={`
                w-16 h-16 rounded-3xl flex items-center justify-center relative
                ${isToday 
                  ? 'bg-gradient-to-br from-muted/30 to-muted/20 ring-2 ring-primary/30' 
                  : 'bg-gradient-to-br from-muted/20 to-muted/10'
                }
                backdrop-blur-sm border border-muted/20 transition-all duration-300
              `}>
                <span className={`text-xl font-medium ${isToday ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  {day}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  if (!workoutPlan) {
    return (
      <Card className="p-8 text-center bg-glass/30 backdrop-blur-glass border-glass-border max-w-md mx-auto">
        <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Workout Plan</h3>
        <p className="text-muted-foreground">Complete your onboarding to generate a personalized workout schedule.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Calendar Header */}
        <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" size="sm" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-xl font-semibold">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <Button variant="ghost" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 mb-2">
            {daysOfWeek.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-3 p-2">
            {renderCalendar()}
          </div>
        </Card>

        {/* Weekly Schedule Overview */}
        <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            Weekly Training Schedule
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workoutPlan.days.map((day, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-glass/20 rounded-lg border border-glass-border/50">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="min-w-[60px] justify-center font-medium">
                    {day.day}
                  </Badge>
                  <div>
                    <p className="font-medium">{day.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {day.exercises.length} exercises
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {day.duration} min
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Daily Workout Dialog */}
      <DailyWorkoutDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        date={selectedDate}
        workoutPlan={workoutPlan}
        completedWorkout={selectedDate ? getCompletedWorkoutForDate(selectedDate) : null}
      />
    </>
  );
};
