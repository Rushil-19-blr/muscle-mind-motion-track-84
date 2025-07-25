import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import OnboardingForm from '@/components/OnboardingForm';
import { ScheduleApproval } from '@/components/ScheduleApproval';
import { SignInPage } from '@/components/SignInPage';
import { CreateAccountPage } from '@/components/CreateAccountPage';
import Dashboard from '@/components/Dashboard';
import { WorkoutConfirmation } from '@/components/WorkoutConfirmation';
import WorkoutSession from '@/components/WorkoutSession';
import { ViewPlan } from '@/components/ViewPlan';
import { ModifySchedule } from '@/components/ModifySchedule';
import { ProgressCharts } from '@/components/ProgressCharts';
import { AccountPage } from '@/components/AccountPage';
import { UpdateMetrics } from '@/components/UpdateMetrics';

import { BottomNavigation } from '@/components/BottomNavigation';
import { TopRightActions } from '@/components/TopRightActions';
import { PageTransition } from '@/components/PageTransition';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { RexChatbot } from '@/components/RexChatbot';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { useWorkoutPlan } from '@/contexts/WorkoutPlanContext';
import { useAuth } from '@/hooks/useAuth';
import { googleAIService, WorkoutPlan } from '@/services/GoogleAIService';
import { firestoreService, UserData } from '@/services/FirestoreService';
import { authService } from '@/services/AuthService';
import { auth } from '@/lib/firebase';
import { Play, Target, BarChart3, Sparkles, Dumbbell, Zap, Trophy, ArrowLeft } from 'lucide-react';
import heroImage from '@/assets/hero-fitness.jpg';
import { useToast } from '@/hooks/use-toast';

type AppState = 'landing' | 'sign-in' | 'create-account' | 'onboarding' | 'dashboard' | 'workout-confirmation' | 'workout' | 'schedule-approval' | 'modify-schedule' | 'view-plan' | 'account' | 'update-metrics' | 'progress-charts' | 'view-prs';

const Index = () => {
  const [appState, setAppState] = useState<AppState>('landing');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [pendingPlan, setPendingPlan] = useState<WorkoutPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'none'>('none');
  const { setWorkoutPlan, workoutPlan } = useWorkoutPlan();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  // Force dark mode on app load
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('darkMode', 'true');
  }, []);

  // Load user data when user is authenticated
  useEffect(() => {
    const loadUserData = async () => {
      console.log('LoadUserData effect running:', { user: !!user, userData: !!userData, appState, loading, workoutPlan: !!workoutPlan });
      
      if (user && !userData) {
        try {
          const data = await firestoreService.getUserData(user.uid);
          console.log('Loaded user data from Firestore:', !!data);
          
          if (data) {
            setUserData(data);
            // Only redirect to dashboard if we're on landing page
            if (appState === 'landing') {
              console.log('Redirecting to dashboard from landing');
              setAppState('dashboard');
            }
            // Don't redirect if we're in other states - let the current flow complete
            
            // Load workout plan
            const plan = await firestoreService.getWorkoutPlan(user.uid);
            console.log('Loaded workout plan from Firestore:', !!plan);
            if (plan) {
              setWorkoutPlan(plan);
            }
            } else if (appState === 'landing') {
              // New user, go to account creation only if we're on landing
              console.log('New user, redirecting to create account');
              setAppState('create-account');
            }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else if (!user && !loading && appState !== 'landing' && appState !== 'sign-in' && appState !== 'create-account' && appState !== 'onboarding' && appState !== 'schedule-approval') {
        // User is not authenticated and not on landing/sign-in/onboarding/schedule-approval, reset state
        console.log('User not authenticated, resetting state');
        setAppState('landing');
        setUserData(null);
        setWorkoutPlan(null);
      }
    };

    // Only run this effect if we're not in loading state
    if (!loading) {
      loadUserData();
    }
  }, [user, loading, userData, setWorkoutPlan, appState]);

  const handleOnboardingComplete = async (data: Omit<UserData, 'userId'>) => {
    // Store the data temporarily
    setUserData({ ...data, userId: '' } as UserData);
    
    // Generate workout plan immediately
    setIsGeneratingPlan(true);
    
    toast({
      title: "Generating Your Plan",
      description: "Our AI is creating a personalized workout plan for you...",
    });
    
    try {
      const workoutPlan = await googleAIService.generateWorkoutPlan(data);
      setPendingPlan(workoutPlan);
      setAppState('schedule-approval');
    } catch (error) {
      console.error('Error generating workout plan:', error);
      toast({
        title: "Error",
        description: "Failed to generate workout plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSignInComplete = async () => {
    // Direct sign in from landing page
    setAppState('dashboard');
  };

  const handleSignUpComplete = async () => {
    // Wait a bit for auth state to update after signup
    setTimeout(async () => {
      // If we have a pending plan, save everything and go to dashboard
      if (pendingPlan && userData && user) {
        await handleConfirmAndSignUp(pendingPlan);
      } else {
        // Check if we have onboarding data to save
        if (userData) {
          // Wait for user state to be available
          let currentUser = user;
          let attempts = 0;
          while (!currentUser && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            currentUser = auth.currentUser;
            attempts++;
          }
          
          if (currentUser) {
            try {
              const userDataToSave = { ...userData, userId: currentUser.uid };
              await firestoreService.saveUserData(currentUser.uid, userDataToSave);
              setUserData(userDataToSave);
              
              // If we have a pending plan, save it too
              if (pendingPlan) {
                await firestoreService.saveWorkoutPlan(currentUser.uid, pendingPlan);
                setWorkoutPlan(pendingPlan);
                setPendingPlan(null);
              }
              
              setAppState('dashboard');
              
              toast({
                title: "Welcome!",
                description: "Your profile has been saved successfully.",
              });
            } catch (error) {
              console.error('Error saving user data:', error);
              toast({
                title: "Error",
                description: "Failed to save data. Please try again.",
                variant: "destructive",
              });
            }
          } else {
            console.error('User not available after signup');
            toast({
              title: "Error",
              description: "Authentication issue. Please try again.",
              variant: "destructive",
            });
          }
        } else {
          // Direct sign up from landing page
          setAppState('dashboard');
        }
      }
    }, 500);
  };


  const handleDirectSignIn = () => {
    setShowLoginDialog(true);
  };

  const handleLoginComplete = () => {
    setShowLoginDialog(false);
    // User data will be loaded by useEffect
  };

  const handleScheduleApproved = async (plan: WorkoutPlan) => {
    // Store the approved plan and go to account creation
    setPendingPlan(plan);
    setAppState('create-account');
  };

  const handleConfirmAndSignUp = async (plan: WorkoutPlan) => {
    if (user && userData) {
      try {
        // Save both user data and workout plan
        const userDataToSave = { ...userData, userId: user.uid };
        await firestoreService.saveUserData(user.uid, userDataToSave);
        await firestoreService.saveWorkoutPlan(user.uid, plan);
        
        setUserData(userDataToSave);
        setWorkoutPlan(plan);
        setPendingPlan(null);
        setAppState('dashboard');
        
        toast({
          title: "Welcome to Your Fitness Journey!",
          description: "Your personalized workout plan is now ready to use.",
        });
      } catch (error) {
        console.error('Error saving user data and workout plan:', error);
        toast({
          title: "Error",
          description: "Failed to save your data. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handlePlanModification = async (modifiedPlan: WorkoutPlan) => {
    setPendingPlan(modifiedPlan);
    // Stay in schedule-approval state to show the updated plan
  };

  const handleStartWorkout = () => {
    setAppState('workout-confirmation');
  };

  const handleConfirmWorkout = () => {
    setAppState('workout');
  };

  const handleCancelWorkout = () => {
    setAppState('dashboard');
  };

  const handleWorkoutComplete = () => {
    setAppState('dashboard');
  };

  const handleWorkoutExit = () => {
    setAppState('dashboard');
  };

  const handleModifySchedule = () => {
    setAppState('modify-schedule');
  };

  const handleViewPlan = () => {
    setAppState('view-plan');
  };

  const handleNavigate = (page: string) => {
    // Reset swipe direction
    setSwipeDirection('none');
    
    switch (page) {
      case 'dashboard':
        setAppState('dashboard');
        break;
      case 'workout':
        handleStartWorkout();
        break;
      case 'view-schedule':
        setAppState('view-plan');
        break;
      case 'modify-schedule':
        handleModifySchedule();
        break;
      case 'progress-charts':
        setAppState('progress-charts');
        break;
      case 'view-prs':
        setAppState('view-prs');
        break;
      case 'account':
        setAppState('account');
        break;
      case 'update-metrics':
        setAppState('update-metrics');
        break;
      default:
        setAppState('dashboard');
    }
  };

  // Page order for swipe navigation
  const pageOrder = ['dashboard', 'view-plan', 'modify-schedule', 'progress-charts'];
  
  const handleSwipeLeft = () => {
    const currentIndex = pageOrder.indexOf(getCurrentPageId());
    if (currentIndex < pageOrder.length - 1) {
      setSwipeDirection('left');
      setTimeout(() => {
        handleNavigate(pageOrder[currentIndex + 1]);
      }, 150);
    }
  };

  const handleSwipeRight = () => {
    const currentIndex = pageOrder.indexOf(getCurrentPageId());
    if (currentIndex > 0) {
      setSwipeDirection('right');
      setTimeout(() => {
        handleNavigate(pageOrder[currentIndex - 1]);
      }, 150);
    }
  };

  const getCurrentPageId = () => {
    switch (appState) {
      case 'dashboard': return 'dashboard';
      case 'view-plan': return 'view-plan';
      case 'modify-schedule': return 'modify-schedule';
      case 'progress-charts': return 'progress-charts';
      default: return 'dashboard';
    }
  };

  // Add swipe navigation for main app pages
  useSwipeNavigation({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight
  });

  const handleLogout = async () => {
    try {
      await authService.signOut();
      setAppState('landing');
      setUserData(null);
      setWorkoutPlan(null);
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMetrics = async (updatedData: UserData) => {
    if (user) {
      try {
        await firestoreService.updateUserData(user.uid, updatedData);
        setUserData(updatedData);
        toast({
          title: "Success",
          description: "Your metrics have been updated successfully.",
        });
      } catch (error) {
        console.error('Error updating metrics:', error);
        toast({
          title: "Error",
          description: "Failed to update metrics. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return <LoadingAnimation message="Loading your fitness journey..." />;
  }

  if (appState === 'onboarding') {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 flex items-center justify-center">
          {isGeneratingPlan ? (
            <LoadingAnimation message="Our AI is analyzing your profile and creating a personalized workout plan..." />
          ) : (
            <>
              <Card className="w-full max-w-4xl p-8 bg-glass/30 backdrop-blur-glass border-glass-border shadow-elevated">
                <OnboardingForm 
                  onComplete={handleOnboardingComplete} 
                  onExit={() => setAppState('landing')}
                />
              </Card>
            </>
          )}
        </div>
      </>
    );
  }

  if (appState === 'schedule-approval' && pendingPlan) {
    return (
      <>
        <ScheduleApproval
          workoutPlan={pendingPlan}
          onApprove={handleScheduleApproved}
          onModify={handlePlanModification}
          isOpen={true}
          onClose={() => setAppState('onboarding')}
          showSignUp={true}
        />
      </>
    );
  }

  if (appState === 'dashboard') {
    return (
      <>
        <TopRightActions
          userName={userData?.name || 'User'}
          onAccountClick={() => setAppState('account')}
          onUpdateMetricsClick={() => setAppState('update-metrics')}
        />
        <BottomNavigation 
          currentPage="dashboard"
          onNavigate={handleNavigate}
        />
        {userData && <RexChatbot userData={userData} workoutPlan={workoutPlan} onPlanModified={setWorkoutPlan} />}
        <PageTransition currentPage="dashboard" direction={swipeDirection}>
          <div className="pb-24">
            <Dashboard 
              onStartWorkout={handleStartWorkout}
              onModifySchedule={handleModifySchedule}
              onViewPlan={handleViewPlan}
            />
          </div>
        </PageTransition>
      </>
    );
  }

  if (appState === 'modify-schedule') {
    return (
      <>
        <BottomNavigation 
          currentPage="modify-schedule"
          onNavigate={handleNavigate}
        />
        <RexChatbot userData={userData} workoutPlan={workoutPlan} />
        <PageTransition currentPage="modify-schedule" direction={swipeDirection}>
          <div className="pb-24">
            <ModifySchedule 
              workoutPlan={workoutPlan}
              onBack={() => setAppState('dashboard')}
              onPlanUpdated={async (updatedPlan) => {
                if (user) {
                  try {
                    await firestoreService.updateWorkoutPlan(user.uid, updatedPlan);
                    setWorkoutPlan(updatedPlan);
                    setAppState('dashboard');
                  } catch (error) {
                    console.error('Error updating workout plan:', error);
                    toast({
                      title: "Error",
                      description: "Failed to update workout plan. Please try again.",
                      variant: "destructive",
                    });
                  }
                }
              }}
              userData={userData}
            />
          </div>
        </PageTransition>
      </>
    );
  }

  if (appState === 'view-plan') {
    return (
      <>
        <BottomNavigation 
          currentPage="view-schedule"
          onNavigate={handleNavigate}
        />
        <PageTransition currentPage="view-plan" direction={swipeDirection}>
          <div className="pb-24">
            <ViewPlan 
              workoutPlan={workoutPlan}
              onBack={() => setAppState('dashboard')}
              onModifySchedule={() => setAppState('modify-schedule')}
            />
          </div>
        </PageTransition>
      </>
    );
  }

  if (appState === 'workout-confirmation') {
    const getTodaysWorkout = () => {
      if (!workoutPlan) return { name: 'Workout', exercises: 0, duration: 0 };
      
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const todaysWorkoutDay = workoutPlan.days.find(day => 
        day.day.toLowerCase().trim() === today
      );
      
      if (!todaysWorkoutDay) return { name: 'Workout', exercises: 0, duration: 0 };
      
      return {
        name: todaysWorkoutDay.name,
        exercises: todaysWorkoutDay.exercises.length,
        duration: todaysWorkoutDay.duration
      };
    };

    const todaysWorkout = getTodaysWorkout();

    return (
      <WorkoutConfirmation
        onConfirm={handleConfirmWorkout}
        onCancel={handleCancelWorkout}
        workoutName={todaysWorkout.name}
        exercises={todaysWorkout.exercises}
        duration={todaysWorkout.duration}
      />
    );
  }

  if (appState === 'workout') {
    return (
      <>
        <RexChatbot userData={userData} workoutPlan={workoutPlan} isWorkoutMode={true} />
        <WorkoutSession
          onComplete={handleWorkoutComplete}
          onExit={handleWorkoutExit}
        />
      </>
    );
  }

  if (appState === 'progress-charts') {
    return (
      <>
        <BottomNavigation 
          currentPage="progress-charts"
          onNavigate={handleNavigate}
        />
        <PageTransition currentPage="progress-charts" direction={swipeDirection}>
          <div className="pb-24">
            <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-2 sm:p-4">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Progress Analytics</h1>
                </div>
                <ProgressCharts />
              </div>
            </div>
          </div>
        </PageTransition>
      </>
    );
  }

  if (appState === 'view-prs') {
    return (
      <>
        <BottomNavigation 
          currentPage="view-prs"
          onNavigate={handleNavigate}
        />
        <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 pb-24">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setAppState('dashboard')} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-3xl font-bold">Personal Records</h1>
            </div>
            
            <Card className="p-8 bg-glass/30 backdrop-blur-glass border-glass-border shadow-elevated">
              <div className="text-center space-y-4">
                <Trophy className="w-16 h-16 mx-auto text-accent" />
                <h2 className="text-2xl font-bold">Your Personal Records</h2>
                <p className="text-muted-foreground">Track your strength progress and celebrate your achievements!</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  {[
                    { name: 'Bench Press', current: userData?.benchPress || '0', unit: 'kg' },
                    { name: 'Squat', current: userData?.squat || '0', unit: 'kg' },
                    { name: 'Deadlift', current: userData?.deadlift || '0', unit: 'kg' },
                    { name: 'Overhead Press', current: userData?.overheadPress || '0', unit: 'kg' }
                  ].map((lift, index) => (
                    <Card key={index} className="p-4 bg-glass/20 backdrop-blur-glass border-glass-border">
                      <h3 className="font-semibold text-lg mb-2">{lift.name}</h3>
                      <div className="text-3xl font-bold text-primary">{lift.current} {lift.unit}</div>
                      <p className="text-sm text-muted-foreground mt-1">Current PR</p>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (appState === 'account') {
    return (
      <>
        <AccountPage
          userName={userData?.name || 'User'}
          userEmail={user?.email || 'user@email.com'}
          onBack={() => setAppState('dashboard')}
          onLogout={handleLogout}
        />
      </>
    );
  }

  if (appState === 'update-metrics') {
    return (
      <>
        <UpdateMetrics
          onBack={() => setAppState('dashboard')}
          userData={userData}
          onUpdate={handleUpdateMetrics}
        />
      </>
    );
  }

  if (appState === 'sign-in') {
    return (
      <SignInPage 
        onBack={() => setAppState('landing')}
        onSignInComplete={handleSignInComplete}
        onCreateAccount={() => setAppState('create-account')}
      />
    );
  }

  if (appState === 'create-account') {
    return (
      <CreateAccountPage 
        onBack={() => setAppState('landing')}
        onSignUpComplete={handleSignUpComplete}
        onHaveAccount={() => setAppState('sign-in')}
      />
    );
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary">
      
      {/* Sign In Button */}
      <Button
        variant="outline"
        onClick={() => setAppState('sign-in')}
        className="fixed top-4 right-20 z-50 bg-glass/20 backdrop-blur-glass border border-glass-border hover:bg-glass/30 transition-all duration-300"
      >
        Sign In
      </Button>
      
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 px-3 sm:px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            
            {/* Left Column - Text */}
            <div className="space-y-6 sm:space-y-8 animate-fade-in text-center lg:text-left">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-accent" />
                  <span className="text-accent font-medium">AI-Powered Fitness</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  Transform Your{' '}
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Fitness Journey
                  </span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0">
                  Get personalized workout plans, track your progress with precision, 
                  and achieve your fitness goals with AI-powered insights.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="xl" 
                  variant="accent" 
                  onClick={() => setAppState('onboarding')}
                  className="flex items-center gap-2 animate-glow-pulse"
                >
                  <Play className="w-5 h-5" />
                  Start Your Journey
                </Button>
              </div>

              {/* Stats */}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-3 sm:space-y-4 mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              Everything You Need to{' '}
              <span className="text-primary">Succeed</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Our AI-powered platform adapts to your needs, creating personalized 
              experiences that evolve with your progress.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Feature 1 */}
            <Card className="p-6 sm:p-8 bg-glass/30 backdrop-blur-glass border-glass-border shadow-glass hover:shadow-elevated transition-all duration-300 hover:scale-105 sm:col-span-2 md:col-span-1">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-light rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">AI Workout Generation</h3>
                <p className="text-muted-foreground">
                  Get custom workout plans tailored to your goals, equipment, 
                  and schedule. Our AI learns from your progress and adapts.
                </p>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card className="p-6 sm:p-8 bg-glass/30 backdrop-blur-glass border-glass-border shadow-glass hover:shadow-elevated transition-all duration-300 hover:scale-105">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-r from-secondary to-secondary-light rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Progress Tracking</h3>
                <p className="text-muted-foreground">
                  Visualize your journey with detailed analytics, PR tracking, 
                  and performance insights that keep you motivated.
                </p>
              </div>
            </Card>

            {/* Feature 3 */}
            <Card className="p-6 sm:p-8 bg-glass/30 backdrop-blur-glass border-glass-border shadow-glass hover:shadow-elevated transition-all duration-300 hover:scale-105 sm:col-span-2 md:col-span-1">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-gradient-to-r from-accent to-accent-glow rounded-2xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Smart Goal Setting</h3>
                <p className="text-muted-foreground">
                  Set realistic, achievable goals with our intelligent system 
                  that adjusts based on your progress and lifestyle.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-8 sm:p-10 md:p-12 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 backdrop-blur-glass shadow-elevated">
            <div className="space-y-4 sm:space-y-6">
              <Zap className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-accent animate-glow-pulse" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                Ready to Level Up Your Fitness?
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                Join thousands of fitness enthusiasts who have transformed their 
                bodies and minds with our AI-powered training system.
              </p>
               <Button 
                 size="xl" 
                 variant="accent" 
                 onClick={() => setAppState('onboarding')}
                 className="flex items-center gap-2 mx-auto animate-glow-pulse"
               >
                 <Dumbbell className="w-5 h-5" />
                 Get Started Free
               </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Login Dialog - Removed as LoginDialog component doesn't exist */}
    </div>
  );
};

export default Index;
