import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Target, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { firestoreService } from '@/services/FirestoreService';

export const ProgressCharts: React.FC = () => {
  const { user } = useAuth();
  const [workoutStats, setWorkoutStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkoutStats = async () => {
      if (!user) return;
      
      try {
        const stats = await firestoreService.getWorkoutStats(user.uid);
        setWorkoutStats(stats);
      } catch (error) {
        console.error('Error fetching workout stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutStats();
  }, [user]);

  // Transform muscle group stats for display
  const muscleGroupData = workoutStats?.muscleGroupStats 
    ? Object.entries(workoutStats.muscleGroupStats).map(([name, sessions]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        sessions: sessions as number,
        color: getColorForMuscleGroup(name)
      })).sort((a, b) => b.sessions - a.sessions)
    : [];

  // Helper function to get colors for muscle groups
  function getColorForMuscleGroup(muscleGroup: string): string {
    const colorMap: { [key: string]: string } = {
      'chest': '#3b82f6',
      'back': '#10b981', 
      'legs': '#f59e0b',
      'shoulders': '#ef4444',
      'arms': '#8b5cf6',
      'biceps': '#8b5cf6',
      'triceps': '#8b5cf6',
      'quads': '#f59e0b',
      'hamstrings': '#f59e0b',
      'glutes': '#f59e0b',
      'calves': '#f59e0b',
      'core': '#06b6d4',
      'abs': '#06b6d4'
    };
    return colorMap[muscleGroup.toLowerCase()] || '#6b7280';
  }

  // Format volume display
  const formatVolume = (volume: number): string => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k kg`;
    }
    return `${volume} kg`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border shadow-elevated">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted/30 rounded w-1/3"></div>
            <div className="h-40 bg-muted/30 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Render charts directly without dialog wrapper */}
      <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border shadow-elevated">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
          Progress Analytics
        </h2>

        <div className="space-y-6">
          <Tabs defaultValue="strength" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-glass/30 backdrop-blur-glass">
              <TabsTrigger value="strength">Strength</TabsTrigger>
              <TabsTrigger value="volume">Volume</TabsTrigger>
              <TabsTrigger value="consistency">Consistency</TabsTrigger>
              <TabsTrigger value="muscle-groups">Muscle Groups</TabsTrigger>
            </TabsList>

            <TabsContent value="strength" className="space-y-4">
              <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-success" />
                  <h3 className="text-lg font-semibold">Strength Progress</h3>
                </div>
                 <div className="space-y-6">
                   {workoutStats?.strengthProgress && Object.keys(workoutStats.strengthProgress).length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {Object.entries(workoutStats.strengthProgress).map(([exercise, data]: [string, any]) => (
                         <div key={exercise} className="space-y-2">
                           <div className="flex justify-between text-sm">
                             <span>{exercise}</span>
                             <span className="font-medium">{data.current} kg</span>
                           </div>
                           <Progress value={Math.min((data.current / (data.current + 20)) * 100, 100)} className="h-2" />
                           <p className="text-xs text-muted-foreground">
                             {data.progress > 0 ? `+${data.progress} kg progress` : 'No progress yet'}
                           </p>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-center text-muted-foreground py-8">
                       <p>No strength data available yet.</p>
                       <p className="text-xs mt-1">Complete more workouts to track your strength progress!</p>
                     </div>
                   )}
                 </div>
              </Card>

              {workoutStats?.strengthProgress && Object.keys(workoutStats.strengthProgress).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(workoutStats.strengthProgress).map(([exerciseName, data]: [string, any], index) => (
                    <Card key={index} className="p-4 bg-glass/20 backdrop-blur-glass border-glass-border">
                      <h4 className="font-medium text-sm mb-2">{exerciseName}</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Current</span>
                          <span className="font-bold">{data.current} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">Progress</span>
                          <Badge variant="secondary" className="text-xs">
                            {data.progress > 0 ? `+${data.progress} kg` : 'Starting'}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="volume" className="space-y-4">
              <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Training Volume</h3>
                </div>
                 <div className="space-y-4">
                   {workoutStats ? (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <Card className="p-4 bg-glass/20 backdrop-blur-glass border-glass-border">
                         <h4 className="font-medium text-sm mb-2">Total Volume</h4>
                         <p className="text-2xl font-bold text-primary">{formatVolume(workoutStats.totalVolume)}</p>
                         <p className="text-xs text-muted-foreground">All time</p>
                       </Card>
                       <Card className="p-4 bg-glass/20 backdrop-blur-glass border-glass-border">
                         <h4 className="font-medium text-sm mb-2">Total Workouts</h4>
                         <p className="text-2xl font-bold text-secondary">{workoutStats.totalWorkouts}</p>
                         <p className="text-xs text-muted-foreground">Completed</p>
                       </Card>
                       <Card className="p-4 bg-glass/20 backdrop-blur-glass border-glass-border">
                         <h4 className="font-medium text-sm mb-2">This Month</h4>
                         <p className="text-2xl font-bold text-accent">{workoutStats.thisMonthWorkouts}</p>
                         <p className="text-xs text-muted-foreground">Workouts</p>
                       </Card>
                     </div>
                   ) : (
                     <div className="text-center text-muted-foreground py-8">
                       <p>No volume data available yet.</p>
                       <p className="text-xs mt-1">Complete workouts to track your training volume!</p>
                     </div>
                   )}
                 </div>
              </Card>
            </TabsContent>

            <TabsContent value="consistency" className="space-y-4">
              <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-semibold">Workout Consistency</h3>
                </div>
                 <div className="space-y-4">
                   {workoutStats ? (
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <Card className="p-4 bg-success/10 border-success/20">
                         <h4 className="font-medium text-sm mb-2">This Month</h4>
                         <p className="text-2xl font-bold text-success">{workoutStats.thisMonthWorkouts}</p>
                         <p className="text-xs text-muted-foreground">Workouts</p>
                       </Card>
                       <Card className="p-4 bg-primary/10 border-primary/20">
                         <h4 className="font-medium text-sm mb-2">Current Streak</h4>
                         <p className="text-2xl font-bold text-primary">{workoutStats.currentStreak}</p>
                         <p className="text-xs text-muted-foreground">Days</p>
                       </Card>
                       <Card className="p-4 bg-warning/10 border-warning/20">
                         <h4 className="font-medium text-sm mb-2">Total</h4>
                         <p className="text-2xl font-bold text-warning">{workoutStats.totalWorkouts}</p>
                         <p className="text-xs text-muted-foreground">Workouts</p>
                       </Card>
                       <Card className="p-4 bg-accent/10 border-accent/20">
                         <h4 className="font-medium text-sm mb-2">Total Volume</h4>
                         <p className="text-2xl font-bold text-accent">{formatVolume(workoutStats.totalVolume)}</p>
                         <p className="text-xs text-muted-foreground">Lifted</p>
                       </Card>
                     </div>
                   ) : (
                     <div className="text-center text-muted-foreground py-8">
                       <p>No consistency data available yet.</p>
                       <p className="text-xs mt-1">Complete workouts to track your consistency!</p>
                     </div>
                   )}
                 </div>
              </Card>
            </TabsContent>

            <TabsContent value="muscle-groups" className="space-y-4">
              <Card className="p-6 bg-glass/30 backdrop-blur-glass border-glass-border">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-secondary" />
                  <h3 className="text-lg font-semibold">Muscle Group Distribution</h3>
                </div>
                 <div className="space-y-3">
                   {muscleGroupData.length > 0 ? (
                     muscleGroupData.map((group, index) => {
                       const maxSessions = Math.max(...muscleGroupData.map(g => g.sessions));
                       return (
                         <div key={index} className="space-y-2">
                           <div className="flex items-center justify-between">
                             <span className="font-medium">{group.name}</span>
                             <Badge variant="outline">{group.sessions} sets</Badge>
                           </div>
                           <Progress 
                             value={maxSessions > 0 ? (group.sessions / maxSessions) * 100 : 0} 
                             className="h-2"
                           />
                         </div>
                       );
                     })
                   ) : (
                     <div className="text-center text-muted-foreground py-8">
                       <p>No muscle group data available yet.</p>
                       <p className="text-xs mt-1">Complete workouts to see muscle group distribution!</p>
                     </div>
                   )}
                 </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};