import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Bot, User, X, Minimize2, Maximize2 } from 'lucide-react';
import { googleAIService, WorkoutPlan } from '@/services/GoogleAIService';
import { useWorkoutPlan } from '@/contexts/WorkoutPlanContext';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'rex';
  timestamp: Date;
}

interface RexChatbotProps {
  userData?: any;
  workoutPlan?: any;
  isWorkoutMode?: boolean;
  currentExercise?: string;
  onPlanModified?: (plan: WorkoutPlan) => void;
}

export const RexChatbot: React.FC<RexChatbotProps> = ({ 
  userData, 
  workoutPlan,
  isWorkoutMode = false,
  currentExercise,
  onPlanModified
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hi! I'm Rex, your AI fitness assistant! 🏋️‍♂️ I'm here to help you with your workouts, answer questions about your training plan, and provide guidance on your fitness journey. What can I help you with today?`,
      sender: 'rex',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingModification, setPendingModification] = useState<WorkoutPlan | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await getRexResponse(inputMessage);
      
      const rexMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'rex',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, rexMessage]);
    } catch (error) {
      console.error('Error getting Rex response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble processing your request right now. Please try again in a moment!",
        sender: 'rex',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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

    // Check if user is asking to modify the workout plan
    const modifyKeywords = ['modify', 'change', 'adjust', 'update', 'alter', 'customize'];
    const isModifyRequest = modifyKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword)
    ) && userInput.toLowerCase().includes('plan');

    if (isModifyRequest && workoutPlan) {
      try {
        const modifiedPlan = await googleAIService.adaptWorkoutPlan(workoutPlan, userInput);
        setPendingModification(modifiedPlan);
        setShowApprovalDialog(true);
        return `I've created a modified workout plan based on your request! Please review the changes and let me know if you'd like to approve them. 💪`;
      } catch (error) {
        console.error('Error modifying plan:', error);
        return "I had trouble modifying your plan. Could you try rephrasing your request?";
      }
    }

    const prompt = `
      You are Rex, an AI fitness assistant and personal trainer. You are helpful, motivational, and knowledgeable about fitness, nutrition, and health. Always respond in a friendly, encouraging tone with appropriate emojis.

      User Context:
      ${JSON.stringify(contextInfo, null, 2)}

      Current Mode: ${isWorkoutMode ? 'Workout Session' : 'General Assistance'}
      ${currentExercise ? `Current Exercise: ${currentExercise}` : ''}

      User Question: "${userInput}"

      Instructions:
      1. If asked about today's workout, check the workout plan for the current day
      2. If asked about injuries or pain, provide general advice but recommend consulting a healthcare professional
      3. If in workout mode, focus on exercise-specific guidance, form tips, and motivation
      4. Use the user's data to personalize responses (goals, current lifts, etc.)
      5. Be encouraging and motivational
      6. Keep responses concise but helpful (2-3 sentences max unless detailed explanation needed)
      7. If you don't have specific information, be honest but still helpful
      8. If the user wants to modify their workout plan, tell them to use phrases like "modify my plan" or "change my workout"

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

  const handleApproveModification = () => {
    if (pendingModification && onPlanModified) {
      onPlanModified(pendingModification);
      toast({
        title: "Plan Updated! 🎉",
        description: "Your workout plan has been successfully modified and is now active.",
      });
      
      // Add success message to chat
      const successMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: "Perfect! I've successfully updated your workout plan. The changes are now active and ready to use! 💪",
        sender: 'rex',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
    }
    setPendingModification(null);
    setShowApprovalDialog(false);
  };

  const handleRejectModification = () => {
    setPendingModification(null);
    setShowApprovalDialog(false);
    toast({
      title: "Changes Rejected",
      description: "Your original workout plan remains unchanged.",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const ChatButton = () => (
    <Button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-accent to-accent-glow shadow-glow hover:shadow-elevated transition-all duration-300 animate-glow-pulse"
      size="icon"
    >
      <MessageCircle className="w-6 h-6" />
    </Button>
  );

  if (!isOpen) {
    return <ChatButton />;
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
    }`}>
      <Card className="w-full h-full bg-glass/95 backdrop-blur-glass border-glass-border shadow-elevated flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-glass-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-accent-glow flex items-center justify-center">
              <Bot className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Rex</h3>
              <p className="text-xs text-muted-foreground">AI Fitness Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="w-8 h-8"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-glass/50 border border-glass-border'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {message.sender === 'rex' && (
                          <Bot className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                        {message.sender === 'user' && (
                          <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-glass/50 border border-glass-border p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-accent" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-glass-border">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Rex anything about your workout..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="icon"
                  variant="accent"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Plan Modification Approval Dialog */}
      {showApprovalDialog && pendingModification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] bg-glass/95 backdrop-blur-glass border-glass-border shadow-elevated overflow-hidden">
            <div className="p-6 border-b border-glass-border">
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Plan Modification Preview
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Review the changes and approve or reject them
              </p>
            </div>
            
            <ScrollArea className="max-h-[50vh] p-6">
              <div className="space-y-4">
                {pendingModification.days.map((day, index) => (
                  <div key={index} className="p-4 bg-glass/30 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{day.day}</Badge>
                      <h4 className="font-semibold">{day.name}</h4>
                      <span className="text-sm text-muted-foreground">({day.duration} min)</span>
                    </div>
                    <div className="space-y-1">
                      {day.exercises.map((exercise, exIndex) => (
                        <div key={exIndex} className="text-sm p-2 bg-accent/10 rounded border border-accent/20">
                          <span className="font-medium text-accent">{exercise.name}</span>
                          <span className="text-muted-foreground ml-2">
                            {exercise.sets} sets × {exercise.reps} reps
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-6 border-t border-glass-border flex gap-3">
              <Button 
                onClick={handleRejectModification}
                variant="outline" 
                className="flex-1"
              >
                Reject Changes
              </Button>
              <Button 
                onClick={handleApproveModification}
                variant="accent" 
                className="flex-1"
              >
                Approve & Apply
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};