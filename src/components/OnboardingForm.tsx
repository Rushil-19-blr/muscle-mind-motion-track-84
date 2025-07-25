import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Target, Dumbbell, User, Utensils, Settings, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserData } from '@/services/FirestoreService';

interface OnboardingFormProps {
  onComplete: (userData: UserData) => void;
  onExit?: () => void;
}

const OnboardingForm: React.FC<OnboardingFormProps> = ({ onComplete, onExit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState<UserData>({
    name: '', age: '', height: '', weight: '', gender: '',
    bodyFat: '', muscleMass: '',
    dietStyle: '', dailyMeals: '', dailyCalories: '', proteinIntake: '',
    currentProgram: '',
    benchPress: '', squat: '', deadlift: '', overheadPress: '', pullUps: '', rows: '',
    primaryGoal: '', secondaryGoal: '', weeklyAvailability: '', preferredDays: [],
    userId: ''
  });
  const [additionalSpecs, setAdditionalSpecs] = useState({
    injuries: '',
    medications: '',
    sleepHours: '',
    stressLevel: '',
    workoutTime: '',
    equipment: '',
    experience: '',
    motivation: ''
  });
  const [isSpecsDialogOpen, setIsSpecsDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateUserData = (field: keyof UserData, value: string | string[]) => {
    setUserData(prev => ({ ...prev, [field]: value }));
  };

  const updateAdditionalSpecs = (field: string, value: string) => {
    setAdditionalSpecs(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    toast({
      title: "Profile Complete!",
      description: "Generating your personalized workout plan...",
    });
    onComplete({ ...userData, additionalSpecs });
  };


  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <User className="w-12 h-12 mx-auto text-primary" />
              <h2 className="text-2xl font-bold">Basic Information</h2>
              <p className="text-muted-foreground">Tell us about yourself</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={userData.name}
                  onChange={(e) => updateUserData('name', e.target.value)}
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  value={userData.age}
                  onChange={(e) => updateUserData('age', e.target.value)}
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="175"
                  value={userData.height}
                  onChange={(e) => updateUserData('height', e.target.value)}
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="70"
                  value={userData.weight}
                  onChange={(e) => updateUserData('weight', e.target.value)}
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={userData.gender} onValueChange={(value) => updateUserData('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Utensils className="w-12 h-12 mx-auto text-secondary" />
              <h2 className="text-2xl font-bold">Nutrition & Body Composition</h2>
              <p className="text-muted-foreground">Help us understand your current state</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bodyFat">Body Fat % (Optional)</Label>
                <Input
                  id="bodyFat"
                  type="number"
                  placeholder="15"
                  value={userData.bodyFat}
                  onChange={(e) => updateUserData('bodyFat', e.target.value)}
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="muscleMass">Muscle Mass (Optional)</Label>
                <Input
                  id="muscleMass"
                  placeholder="e.g., 60kg"
                  value={userData.muscleMass}
                  onChange={(e) => updateUserData('muscleMass', e.target.value)}
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dietStyle">Dietary Style</Label>
                <Select value={userData.dietStyle} onValueChange={(value) => updateUserData('dietStyle', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select diet style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="omnivore">Omnivore</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="pescatarian">Pescatarian</SelectItem>
                    <SelectItem value="keto">Keto</SelectItem>
                    <SelectItem value="paleo">Paleo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dailyMeals">Daily Meals</Label>
                <Input
                  id="dailyMeals"
                  type="number"
                  placeholder="3"
                  value={userData.dailyMeals}
                  onChange={(e) => updateUserData('dailyMeals', e.target.value)}
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dailyCalories">Daily Calories (Estimate)</Label>
                <Input
                  id="dailyCalories"
                  type="number"
                  placeholder="2000"
                  value={userData.dailyCalories}
                  onChange={(e) => updateUserData('dailyCalories', e.target.value)}
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="proteinIntake">Daily Protein (g)</Label>
                <Input
                  id="proteinIntake"
                  type="number"
                  placeholder="120"
                  value={userData.proteinIntake}
                  onChange={(e) => updateUserData('proteinIntake', e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Dumbbell className="w-12 h-12 mx-auto text-accent" />
              <h2 className="text-2xl font-bold">Current Training</h2>
              <p className="text-muted-foreground">Tell us about your current workout routine</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentProgram">Current Workout Program</Label>
                <Textarea
                  id="currentProgram"
                  placeholder="Describe your current workout split, or upload a program if you have one..."
                  value={userData.currentProgram}
                  onChange={(e) => updateUserData('currentProgram', e.target.value)}
                  rows={4}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Dumbbell className="w-12 h-12 mx-auto text-primary" />
              <h2 className="text-2xl font-bold">Strength Benchmarks</h2>
              <p className="text-muted-foreground">What are your current best lifts?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="benchPress">Bench Press (kg)</Label>
                <Input
                  id="benchPress"
                  type="number"
                  placeholder="60"
                  value={userData.benchPress}
                  onChange={(e) => updateUserData('benchPress', e.target.value)}
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="squat">Squat (kg)</Label>
                <Input
                  id="squat"
                  type="number"
                  placeholder="80"
                  value={userData.squat}
                  onChange={(e) => updateUserData('squat', e.target.value)}
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deadlift">Deadlift (kg)</Label>
                <Input
                  id="deadlift"
                  type="number"
                  placeholder="100"
                  value={userData.deadlift}
                  onChange={(e) => updateUserData('deadlift', e.target.value)}
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="overheadPress">Overhead Press (kg)</Label>
                <Input
                  id="overheadPress"
                  type="number"
                  placeholder="40"
                  value={userData.overheadPress}
                  onChange={(e) => updateUserData('overheadPress', e.target.value)}
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pullUps">Pull-ups (reps)</Label>
                <Input
                  id="pullUps"
                  type="number"
                  placeholder="8"
                  value={userData.pullUps}
                  onChange={(e) => updateUserData('pullUps', e.target.value)}
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rows">Rows (kg)</Label>
                <Input
                  id="rows"
                  type="number"
                  placeholder="50"
                  value={userData.rows}
                  onChange={(e) => updateUserData('rows', e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Target className="w-12 h-12 mx-auto text-accent" />
              <h2 className="text-2xl font-bold">Your Goals</h2>
              <p className="text-muted-foreground">What do you want to achieve?</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primaryGoal">Primary Goal</Label>
                <Select value={userData.primaryGoal} onValueChange={(value) => updateUserData('primaryGoal', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose-fat">Lose Fat / Cut</SelectItem>
                    <SelectItem value="gain-muscle">Gain Lean Muscle</SelectItem>
                    <SelectItem value="increase-strength">Increase Strength</SelectItem>
                    <SelectItem value="improve-endurance">Improve Endurance</SelectItem>
                    <SelectItem value="recomposition">Body Recomposition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondaryGoal">Secondary Goal (Optional)</Label>
                <Select value={userData.secondaryGoal} onValueChange={(value) => updateUserData('secondaryGoal', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select secondary goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="lose-fat">Lose Fat / Cut</SelectItem>
                    <SelectItem value="gain-muscle">Gain Lean Muscle</SelectItem>
                    <SelectItem value="increase-strength">Increase Strength</SelectItem>
                    <SelectItem value="improve-endurance">Improve Endurance</SelectItem>
                    <SelectItem value="recomposition">Body Recomposition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weeklyAvailability">Weekly Training Availability</Label>
                <Select value={userData.weeklyAvailability} onValueChange={(value) => updateUserData('weeklyAvailability', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="How many days per week?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days per week</SelectItem>
                    <SelectItem value="4">4 days per week</SelectItem>
                    <SelectItem value="5">5 days per week</SelectItem>
                    <SelectItem value="6">6 days per week</SelectItem>
                    <SelectItem value="7">7 days per week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Additional Specifications Dialog */}
              <div className="space-y-2 md:col-span-2">
                <Dialog open={isSpecsDialogOpen} onOpenChange={setIsSpecsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Additional Specifications (Optional)
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-glass/95 backdrop-blur-glass border-glass-border">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Additional Specifications
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="injuries">Injuries/Limitations</Label>
                        <Textarea
                          id="injuries"
                          placeholder="Any injuries or physical limitations..."
                          value={additionalSpecs.injuries}
                          onChange={(e) => updateAdditionalSpecs('injuries', e.target.value)}
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="medications">Medications</Label>
                        <Textarea
                          id="medications"
                          placeholder="Any medications that might affect training..."
                          value={additionalSpecs.medications}
                          onChange={(e) => updateAdditionalSpecs('medications', e.target.value)}
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sleepHours">Average Sleep Hours</Label>
                        <Input
                          id="sleepHours"
                          type="number"
                          placeholder="7-8"
                          value={additionalSpecs.sleepHours}
                          onChange={(e) => updateAdditionalSpecs('sleepHours', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="stressLevel">Stress Level (1-10)</Label>
                        <Input
                          id="stressLevel"
                          type="number"
                          placeholder="5"
                          min="1"
                          max="10"
                          value={additionalSpecs.stressLevel}
                          onChange={(e) => updateAdditionalSpecs('stressLevel', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="workoutTime">Preferred Workout Time</Label>
                        <Select value={additionalSpecs.workoutTime} onValueChange={(value) => updateAdditionalSpecs('workoutTime', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="early-morning">Early Morning (5-7 AM)</SelectItem>
                            <SelectItem value="morning">Morning (7-10 AM)</SelectItem>
                            <SelectItem value="midday">Midday (10 AM-2 PM)</SelectItem>
                            <SelectItem value="afternoon">Afternoon (2-6 PM)</SelectItem>
                            <SelectItem value="evening">Evening (6-9 PM)</SelectItem>
                            <SelectItem value="night">Night (9 PM+)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="equipment">Available Equipment</Label>
                        <Textarea
                          id="equipment"
                          placeholder="List available equipment (dumbbells, barbell, machines, etc.)"
                          value={additionalSpecs.equipment}
                          onChange={(e) => updateAdditionalSpecs('equipment', e.target.value)}
                          rows={3}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="experience">Training Experience</Label>
                        <Select value={additionalSpecs.experience} onValueChange={(value) => updateAdditionalSpecs('experience', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select experience level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner (0-6 months)</SelectItem>
                            <SelectItem value="novice">Novice (6 months - 2 years)</SelectItem>
                            <SelectItem value="intermediate">Intermediate (2-5 years)</SelectItem>
                            <SelectItem value="advanced">Advanced (5+ years)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="motivation">Motivation/Why</Label>
                        <Textarea
                          id="motivation"
                          placeholder="What motivates you to train? What are you trying to achieve?"
                          value={additionalSpecs.motivation}
                          onChange={(e) => updateAdditionalSpecs('motivation', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={() => setIsSpecsDialogOpen(false)}>
                        Save Specifications
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Exit Button */}
      {onExit && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExit}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        
        <Button
          variant={currentStep === totalSteps ? "accent" : "default"}
          onClick={nextStep}
          className="flex items-center gap-2"
        >
          {currentStep === totalSteps ? "Generate My Plan" : "Next"}
          {currentStep !== totalSteps && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export default OnboardingForm;
