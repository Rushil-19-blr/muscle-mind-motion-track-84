import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UpdateMetricsProps {
  onBack: () => void;
  userData: any;
  onUpdate: (data: any) => void;
}

export const UpdateMetrics: React.FC<UpdateMetricsProps> = ({ 
  onBack, 
  userData, 
  onUpdate 
}) => {
  const [metrics, setMetrics] = useState({
    weight: userData?.weight || '',
    height: userData?.height || '',
    bodyFat: userData?.bodyFat || '',
    benchPress: userData?.benchPress || '',
    squat: userData?.squat || '',
    deadlift: userData?.deadlift || '',
    overheadPress: userData?.overheadPress || '',
    dailyCalories: userData?.dailyCalories || '',
    proteinIntake: userData?.proteinIntake || ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setMetrics(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onUpdate({ ...userData, ...metrics });
    
    toast({
      title: "✅ Metrics Updated Successfully!",
      description: "Your fitness metrics have been updated.",
    });
    
    setIsLoading(false);
    
    // Go back after showing success
    setTimeout(() => {
      onBack();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface to-surface-secondary p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Update Metrics</h1>
        </div>

        {/* Metrics Form */}
        <Card className="p-8 bg-glass/30 backdrop-blur-glass border-glass-border shadow-elevated">
          <div className="space-y-6">
            
            {/* Body Metrics */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Body Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={metrics.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={metrics.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bodyFat">Body Fat %</Label>
                  <Input
                    id="bodyFat"
                    type="number"
                    value={metrics.bodyFat}
                    onChange={(e) => handleInputChange('bodyFat', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Strength Metrics */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Current Lifts (kg)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="benchPress">Bench Press</Label>
                  <Input
                    id="benchPress"
                    type="number"
                    value={metrics.benchPress}
                    onChange={(e) => handleInputChange('benchPress', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="squat">Squat</Label>
                  <Input
                    id="squat"
                    type="number"
                    value={metrics.squat}
                    onChange={(e) => handleInputChange('squat', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deadlift">Deadlift</Label>
                  <Input
                    id="deadlift"
                    type="number"
                    value={metrics.deadlift}
                    onChange={(e) => handleInputChange('deadlift', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="overheadPress">Overhead Press</Label>
                  <Input
                    id="overheadPress"
                    type="number"
                    value={metrics.overheadPress}
                    onChange={(e) => handleInputChange('overheadPress', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Nutrition Metrics */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Nutrition Targets</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dailyCalories">Daily Calories</Label>
                  <Input
                    id="dailyCalories"
                    type="number"
                    value={metrics.dailyCalories}
                    onChange={(e) => handleInputChange('dailyCalories', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="proteinIntake">Daily Protein (g)</Label>
                  <Input
                    id="proteinIntake"
                    type="number"
                    value={metrics.proteinIntake}
                    onChange={(e) => handleInputChange('proteinIntake', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSave}
                disabled={isLoading}
                variant="accent"
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};