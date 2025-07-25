import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopRightActionsProps {
  userName: string;
  onAccountClick: () => void;
  onUpdateMetricsClick: () => void;
}

export const TopRightActions: React.FC<TopRightActionsProps> = ({
  userName,
  onAccountClick,
  onUpdateMetricsClick
}) => {
  return (
    <div className="fixed top-2 sm:top-4 right-2 sm:right-4 z-[9999] flex items-center gap-2 sm:gap-3">
      {/* Update Metrics Button */}
      <Button
        variant="glass"
        size="icon"
        onClick={onUpdateMetricsClick}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-glass/20 backdrop-blur-glass border border-glass-border hover:bg-glass/30 hover:scale-110 transition-all duration-300 shadow-glass"
        title="Update Metrics"
      >
        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
      </Button>

      {/* Account Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onAccountClick}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full p-0 hover:scale-110 transition-all duration-300"
        title="Account Settings"
      >
        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-glass-border shadow-glass">
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
            {userName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Button>
    </div>
  );
};