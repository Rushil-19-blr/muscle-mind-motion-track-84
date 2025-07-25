import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Calendar,
  Flame,
  Zap,
  Trophy,
  Star,
  Medal,
  Crown,
  Sparkles,
  ChevronUp,
  Activity,
  Timer,
  Dumbbell
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { firestoreService } from '@/services/FirestoreService';

// Gaming Components
const StreakFlame = ({ streakDays }: { streakDays: number }) => (
  <div className="relative">
    <div className={`text-4xl animate-streak-fire ${streakDays > 0 ? 'text-fire-gradient' : 'text-muted-foreground'}`}>
      🔥
    </div>
    <div className="absolute -top-2 -right-2 bg-streak-fire text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-bounce-in">
      {streakDays}
    </div>
  </div>
);

const XPBar = ({ currentXP, maxXP, level }: { currentXP: number; maxXP: number; level: number }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-xp-gradient font-bold">Level {level}</span>
      <span className="text-sm text-muted-foreground">{currentXP}/{maxXP} XP</span>
    </div>
    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
      <div 
        className="h-full bg-gradient-to-r from-[hsl(var(--xp-gold))] to-[hsl(var(--neon-yellow))] animate-progress-fill transition-all duration-1000"
        style={{ width: `${(currentXP / maxXP) * 100}%` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
    </div>
  </div>
);

const AchievementBadge = ({ icon, title, description, unlocked }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  unlocked: boolean;
}) => (
  <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
    unlocked 
      ? 'bg-achievement-purple/20 border-achievement-purple/50 hover-neon-glow' 
      : 'bg-muted/10 border-muted/30 opacity-50'
  }`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-full ${unlocked ? 'bg-achievement-purple/30' : 'bg-muted/20'}`}>
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);

const NeonProgressBar = ({ value, max, label, color = 'neon-blue' }: {
  value: number;
  max: number;
  label: string;
  color?: string;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-neon-gradient font-bold">{value}/{max}</span>
    </div>
    <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden animate-neon-pulse">
      <div 
        className={`h-full bg-gradient-to-r from-[hsl(var(--${color}))] to-[hsl(var(--neon-purple))] animate-progress-fill`}
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
  </div>
);

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

  // Calculate gamification stats
  const calculateGameStats = () => {
    if (!workoutStats) return { level: 1, xp: 0, maxXP: 100, streak: 0 };
    
    const totalWorkouts = workoutStats.totalWorkouts || 0;
    const level = Math.floor(totalWorkouts / 10) + 1;
    const xp = (totalWorkouts % 10) * 10;
    const maxXP = 100;
    const streak = workoutStats.currentStreak || 0;
    
    return { level, xp, maxXP, streak };
  };

  const gameStats = calculateGameStats();

  // Achievement system
  const achievements = [
    {
      icon: <Trophy className="w-4 h-4 text-achievement-purple" />,
      title: "First Steps",
      description: "Complete your first workout",
      unlocked: (workoutStats?.totalWorkouts || 0) >= 1
    },
    {
      icon: <Flame className="w-4 h-4 text-streak-fire" />,
      title: "Streak Master",
      description: "Maintain a 7-day streak",
      unlocked: (workoutStats?.currentStreak || 0) >= 7
    },
    {
      icon: <Medal className="w-4 h-4 text-neon-gold" />,
      title: "Volume Beast",
      description: "Lift 10,000kg total volume",
      unlocked: (workoutStats?.totalVolume || 0) >= 10000
    },
    {
      icon: <Crown className="w-4 h-4 text-neon-purple" />,
      title: "Consistency King",
      description: "Complete 50 workouts",
      unlocked: (workoutStats?.totalWorkouts || 0) >= 50
    }
  ];

  // Transform muscle group stats for radar chart
  const muscleGroupData = workoutStats?.muscleGroupStats 
    ? Object.entries(workoutStats.muscleGroupStats).map(([name, sessions]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        sessions: sessions as number,
        percentage: 0 // Will be calculated
      })).sort((a, b) => b.sessions - a.sessions)
    : [];

  // Calculate percentages for muscle groups
  const totalSessions = muscleGroupData.reduce((sum, group) => sum + group.sessions, 0);
  muscleGroupData.forEach(group => {
    group.percentage = totalSessions > 0 ? (group.sessions / totalSessions) * 100 : 0;
  });

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
        <Card className="p-6 bg-background/80 backdrop-blur-sm border border-neon-blue/20 animate-neon-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[hsl(var(--neon-blue))] to-[hsl(var(--neon-purple))] animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 bg-neon-blue/20 rounded animate-pulse w-48" />
              <div className="h-4 bg-neon-purple/20 rounded animate-pulse w-32" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 rounded-lg animate-pulse" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Floating Orb Background Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[hsl(var(--neon-blue))] to-[hsl(var(--neon-purple))] rounded-full opacity-10 blur-3xl animate-float" />
      
      {/* Main Analytics Dashboard */}
      <Card className="p-8 bg-background/90 backdrop-blur-xl border-2 border-neon-blue/30 shadow-[0_0_50px_rgba(59,130,246,0.15)] animate-neon-pulse">
        {/* Header with Level & Streak */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold text-neon-gradient mb-2 animate-bounce-in">
              🚀 Progress Analytics
            </h2>
            <p className="text-muted-foreground">Your fitness journey visualized</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-center">
              <StreakFlame streakDays={gameStats.streak} />
              <p className="text-xs font-medium text-muted-foreground mt-1">Streak</p>
            </div>
            
            <div className="min-w-[200px]">
              <XPBar currentXP={gameStats.xp} maxXP={gameStats.maxXP} level={gameStats.level} />
            </div>
          </div>
        </div>

        {/* Achievement Showcase */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-neon-gradient mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" /> Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <AchievementBadge key={index} {...achievement} />
            ))}
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="strength" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-background/50 backdrop-blur-sm border border-neon-blue/20 mb-6">
            <TabsTrigger value="strength" className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue">💪 Strength</TabsTrigger>
            <TabsTrigger value="volume" className="data-[state=active]:bg-neon-teal/20 data-[state=active]:text-neon-teal">📊 Volume</TabsTrigger>
            <TabsTrigger value="consistency" className="data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green">🔥 Consistency</TabsTrigger>
            <TabsTrigger value="muscle-groups" className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple">🎯 Muscles</TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-neon-pink/20 data-[state=active]:text-neon-pink">🧠 AI Insights</TabsTrigger>
          </TabsList>

          {/* Strength Tab */}
          <TabsContent value="strength" className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-neon-blue/5 to-neon-purple/5 border border-neon-blue/30 hover-neon-glow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-neon-blue/20">
                  <TrendingUp className="w-6 h-6 text-[hsl(var(--neon-blue))]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neon-gradient">Strength Evolution</h3>
                  <p className="text-muted-foreground text-sm">Track your power gains</p>
                </div>
              </div>

              {workoutStats?.strengthProgress && Object.keys(workoutStats.strengthProgress).length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(workoutStats.strengthProgress).map(([exercise, data]: [string, any], index) => (
                      <div key={exercise} className="p-4 bg-background/50 rounded-lg border border-neon-blue/20 hover-scale">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-semibold">{exercise}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-neon-gradient">{data.current}</span>
                            <span className="text-sm text-muted-foreground">kg</span>
                          </div>
                        </div>
                        
                        <NeonProgressBar 
                          value={data.current} 
                          max={data.current + 50} 
                          label="Progress to next milestone"
                          color="neon-blue"
                        />
                        
                        <div className="flex justify-between items-center mt-3">
                          <Badge className={`${data.progress > 0 ? 'bg-neon-green/20 text-neon-green border-neon-green/30' : 'bg-muted/20'}`}>
                            {data.progress > 0 ? `+${data.progress} kg` : 'Starting journey'}
                          </Badge>
                          {data.progress > 0 && (
                            <div className="flex items-center gap-1 text-neon-green text-xs">
                              <ChevronUp className="w-3 h-3" />
                              <span>Growing stronger!</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 rounded-full flex items-center justify-center">
                    <Dumbbell className="w-10 h-10 text-neon-blue" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">No strength data yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Complete workouts to unlock your strength analytics!</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Volume Tab */}
          <TabsContent value="volume" className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-neon-teal/5 to-neon-blue/5 border border-neon-teal/30 hover-neon-glow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-neon-teal/20">
                  <BarChart3 className="w-6 h-6 text-[hsl(var(--neon-teal))]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neon-gradient">Training Volume</h3>
                  <p className="text-muted-foreground text-sm">Power through the numbers</p>
                </div>
              </div>

              {workoutStats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6 bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 border border-neon-blue/20 hover-scale">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-neon-blue/20 rounded-full flex items-center justify-center">
                        <Activity className="w-6 h-6 text-[hsl(var(--neon-blue))]" />
                      </div>
                      <p className="text-3xl font-bold text-neon-gradient">{formatVolume(workoutStats.totalVolume)}</p>
                      <p className="text-sm text-muted-foreground">Total Volume</p>
                    </div>
                  </Card>
                  
                  <Card className="p-6 bg-gradient-to-br from-neon-teal/10 to-neon-green/10 border border-neon-teal/20 hover-scale">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-neon-teal/20 rounded-full flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-[hsl(var(--neon-teal))]" />
                      </div>
                      <p className="text-3xl font-bold text-neon-gradient">{workoutStats.totalWorkouts}</p>
                      <p className="text-sm text-muted-foreground">Workouts Completed</p>
                    </div>
                  </Card>
                  
                  <Card className="p-6 bg-gradient-to-br from-neon-green/10 to-neon-yellow/10 border border-neon-green/20 hover-scale">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 bg-neon-green/20 rounded-full flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-[hsl(var(--neon-green))]" />
                      </div>
                      <p className="text-3xl font-bold text-neon-gradient">{workoutStats.thisMonthWorkouts}</p>
                      <p className="text-sm text-muted-foreground">This Month</p>
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-neon-teal/20 to-neon-blue/20 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-10 h-10 text-neon-teal" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">No volume data yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Start lifting to track your training volume!</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Consistency Tab */}
          <TabsContent value="consistency" className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-neon-green/5 to-neon-yellow/5 border border-neon-green/30 hover-neon-glow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-neon-green/20">
                  <Flame className="w-6 h-6 text-[hsl(var(--neon-green))]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neon-gradient">Consistency Mastery</h3>
                  <p className="text-muted-foreground text-sm">Building unstoppable habits</p>
                </div>
              </div>

              {workoutStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 bg-gradient-to-br from-neon-green/10 to-neon-yellow/10 border border-neon-green/20 hover-scale">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-fire-gradient">{workoutStats.thisMonthWorkouts}</p>
                      <p className="text-xs text-muted-foreground">This Month</p>
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-gradient-to-br from-streak-fire/10 to-neon-orange/10 border border-streak-fire/20 hover-scale">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-fire-gradient">{workoutStats.currentStreak}</p>
                      <p className="text-xs text-muted-foreground">Current Streak</p>
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-gradient-to-br from-neon-purple/10 to-neon-pink/10 border border-neon-purple/20 hover-scale">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-neon-gradient">{workoutStats.totalWorkouts}</p>
                      <p className="text-xs text-muted-foreground">Total Sessions</p>
                    </div>
                  </Card>
                  
                  <Card className="p-4 bg-gradient-to-br from-neon-blue/10 to-neon-teal/10 border border-neon-blue/20 hover-scale">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-neon-gradient">{formatVolume(workoutStats.totalVolume)}</p>
                      <p className="text-xs text-muted-foreground">Total Lifted</p>
                    </div>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-neon-green/20 to-neon-yellow/20 rounded-full flex items-center justify-center">
                    <Timer className="w-10 h-10 text-neon-green" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">Building consistency</p>
                  <p className="text-sm text-muted-foreground mt-1">Your streak starts with your next workout!</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Muscle Groups Tab */}
          <TabsContent value="muscle-groups" className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-neon-purple/5 to-neon-pink/5 border border-neon-purple/30 hover-neon-glow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-neon-purple/20">
                  <Target className="w-6 h-6 text-[hsl(var(--neon-purple))]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neon-gradient">Muscle Radar</h3>
                  <p className="text-muted-foreground text-sm">Balance your training zones</p>
                </div>
              </div>

              {muscleGroupData.length > 0 ? (
                <div className="space-y-4">
                  {muscleGroupData.map((group, index) => {
                    const maxSessions = Math.max(...muscleGroupData.map(g => g.sessions));
                    const colors = ['neon-blue', 'neon-purple', 'neon-teal', 'neon-green', 'neon-pink', 'neon-yellow'];
                    const color = colors[index % colors.length];
                    
                    return (
                      <div key={index} className="p-4 bg-background/50 rounded-lg border border-neon-purple/20 hover-scale">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full bg-[hsl(var(--${color}))]`} />
                            <span className="font-medium">{group.name}</span>
                          </div>
                          <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/30">
                            {group.sessions} sets
                          </Badge>
                        </div>
                        
                        <NeonProgressBar 
                          value={group.sessions} 
                          max={maxSessions} 
                          label={`${group.percentage.toFixed(1)}% of total training`}
                          color={color}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 rounded-full flex items-center justify-center">
                    <Target className="w-10 h-10 text-neon-purple" />
                  </div>
                  <p className="text-lg font-medium text-muted-foreground">Muscle map loading</p>
                  <p className="text-sm text-muted-foreground mt-1">Complete workouts to see your muscle group distribution!</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-neon-pink/5 to-neon-purple/5 border border-neon-pink/30 hover-neon-glow">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-neon-pink/20 animate-xp-sparkle">
                  <Sparkles className="w-6 h-6 text-[hsl(var(--neon-pink))]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-neon-gradient">AI Coaching Insights</h3>
                  <p className="text-muted-foreground text-sm">Your personal training advisor</p>
                </div>
              </div>

              <div className="space-y-4">
                <Card className="p-4 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 border border-neon-blue/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-neon-blue/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-[hsl(var(--neon-blue))]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neon-gradient mb-1">Weekly Focus</h4>
                      <p className="text-sm text-muted-foreground">
                        {workoutStats?.totalWorkouts > 0 
                          ? "Your legs haven't been trained in 6 days. Consider adding squats to tomorrow's session!"
                          : "Start with compound movements like squats and deadlifts for maximum muscle activation!"
                        }
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-r from-neon-green/10 to-neon-yellow/10 border border-neon-green/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-neon-green/20 flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-[hsl(var(--neon-green))]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neon-gradient mb-1">Achievement Potential</h4>
                      <p className="text-sm text-muted-foreground">
                        {gameStats.streak >= 3 
                          ? `Amazing ${gameStats.streak}-day streak! You're ${7 - gameStats.streak} days away from Streak Master!`
                          : "Build a 3-day streak to unlock your first consistency badge!"
                        }
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-gradient-to-r from-neon-purple/10 to-neon-pink/10 border border-neon-purple/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-neon-purple/20 flex items-center justify-center flex-shrink-0">
                      <Crown className="w-4 h-4 text-[hsl(var(--neon-purple))]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neon-gradient mb-1">Next Level Goal</h4>
                      <p className="text-sm text-muted-foreground">
                        Complete {10 - (gameStats.xp / 10)} more workouts to reach Level {gameStats.level + 1} and unlock new achievements!
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};