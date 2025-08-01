import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, VolumeX, Volume2, Bot, User } from 'lucide-react';
import { googleAIService, WorkoutPlan } from '@/services/GoogleAIService';
import { useToast } from '@/hooks/use-toast';

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface TalkWithRexProps {
  userData?: any;
  workoutPlan?: any;
  isWorkoutMode?: boolean;
  currentExercise?: string;
  onPlanModified?: (plan: WorkoutPlan) => void;
}

export const TalkWithRex: React.FC<TalkWithRexProps> = ({ 
  userData, 
  workoutPlan,
  isWorkoutMode = false,
  currentExercise,
  onPlanModified
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [rexResponse, setRexResponse] = useState('');
  const [showPanel, setShowPanel] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'listening' | 'morphing' | 'responding' | 'idle'>('idle');
  
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setUserTranscript('');
        setShowPanel(true);
        setAnimationPhase('listening');
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        setUserTranscript(finalTranscript + interimTranscript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (userTranscript.trim()) {
          handleProcessMessage(userTranscript.trim());
        } else {
          setShowPanel(false);
          setAnimationPhase('idle');
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          toast({
            title: "Voice Error",
            description: "Sorry, I had trouble understanding. Please try again.",
            variant: "destructive"
          });
        }
        setShowPanel(false);
        setAnimationPhase('idle');
      };
    }
  }, [userTranscript]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Could not start recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleProcessMessage = async (message: string) => {
    setIsProcessing(true);
    setAnimationPhase('morphing');
    
    // Simulate morphing animation delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setAnimationPhase('responding');
    
    try {
      const response = await getRexResponse(message);
      setRexResponse(response);
      
      // Speak the response if not muted
      if (!isMuted) {
        await speakResponse(response);
      }
    } catch (error) {
      console.error('Error getting Rex response:', error);
      const errorResponse = "I'm having trouble processing your request right now. Please try again in a moment!";
      setRexResponse(errorResponse);
      
      if (!isMuted) {
        await speakResponse(errorResponse);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getRexResponse = async (userInput: string): Promise<string> => {
    const contextInfo = {
      userData: userData || {},
      workoutPlan: workoutPlan || null,
      isWorkoutMode,
      currentExercise: currentExercise || '',
      currentDate: new Date().toLocaleDateString(),
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' })
    };

    const prompt = `
      You are Rex, an AI fitness assistant and personal trainer. You are helpful, motivational, and knowledgeable about fitness, nutrition, and health. Always respond in a friendly, encouraging tone.

      User Context:
      ${JSON.stringify(contextInfo, null, 2)}

      Current Mode: ${isWorkoutMode ? 'Workout Session' : 'General Assistance'}
      ${currentExercise ? `Current Exercise: ${currentExercise}` : ''}

      User Question: "${userInput}"

      Instructions:
      1. Keep responses concise and conversational (2-3 sentences max for voice)
      2. Be encouraging and motivational
      3. Use the user's data to personalize responses
      4. If in workout mode, focus on exercise-specific guidance
      5. If asked about injuries or pain, provide general advice but recommend consulting a healthcare professional
      6. If you don't have specific information, be honest but still helpful

      Respond as Rex:
    `;

    try {
      const result = await googleAIService.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating Rex response:', error);
      return "I'm having some technical difficulties right now, but I'm here to help! Could you try asking your question again?";
    }
  };

  const speakResponse = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(true);
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to use a better voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Google') || 
          voice.name.includes('Microsoft') ||
          voice.name.includes('Alex')
        );
        
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          resolve();
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleClosePanel = () => {
    setShowPanel(false);
    setAnimationPhase('idle');
    setUserTranscript('');
    setRexResponse('');
    stopSpeaking();
  };

  return (
    <>
      {/* Talk with Rex Button */}
      <Button
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onTouchStart={startListening}
        onTouchEnd={stopListening}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full transition-all duration-300 ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 scale-110 animate-pulse shadow-glow' 
            : 'bg-blue-500 hover:bg-blue-600 shadow-glow hover:scale-110'
        }`}
        size="icon"
      >
        <Mic className="w-6 h-6 text-white" />
      </Button>

      {/* Voice Interaction Panel */}
      {showPanel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <Card className={`w-full max-w-2xl transition-all duration-500 bg-background/90 backdrop-blur-md border-border ${
            animationPhase === 'morphing' 
              ? 'scale-75 rounded-full aspect-square max-w-32 max-h-32 bg-gradient-to-r from-blue-500 to-purple-500 shadow-glow' 
              : 'rounded-2xl'
          }`}>
            
            {/* Listening Phase */}
            {animationPhase === 'listening' && (
              <div className="p-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center animate-pulse">
                    <Mic className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Listening...</h3>
                <p className="text-muted-foreground mb-4">Speak now</p>
                {userTranscript && (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-foreground">{userTranscript}</p>
                  </div>
                )}
              </div>
            )}

            {/* Morphing Phase */}
            {animationPhase === 'morphing' && (
              <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-ping"></div>
              </div>
            )}

            {/* Responding Phase */}
            {animationPhase === 'responding' && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Rex</h3>
                      <p className="text-xs text-muted-foreground">AI Fitness Assistant</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMuted(!isMuted)}
                      className="w-10 h-10"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleClosePanel}
                      className="w-10 h-10"
                    >
                      ×
                    </Button>
                  </div>
                </div>

                {/* User Message */}
                <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 mt-1 text-primary" />
                    <p className="text-foreground">{userTranscript}</p>
                  </div>
                </div>

                {/* Rex Response */}
                <div className="p-4 bg-background/50 rounded-lg border border-border">
                  <div className="flex items-start gap-2">
                    <Bot className="w-4 h-4 mt-1 text-blue-500 flex-shrink-0" />
                    <div className="flex-1">
                      {isProcessing ? (
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">Rex is thinking</span>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-foreground whitespace-pre-wrap">{rexResponse}</p>
                          {isSpeaking && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-blue-500">Speaking...</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleClosePanel}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onMouseDown={startListening}
                    onMouseUp={stopListening}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                    disabled={isListening || isProcessing}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Talk Again
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
};