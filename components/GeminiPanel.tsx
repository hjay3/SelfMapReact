
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface GeminiPanelProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

const Button: React.FC<React.PropsWithChildren<{
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  className?: string;
}>> = ({ onClick, children, disabled = false, className = '' }) => (
  <button onClick={onClick} disabled={disabled} className={`w-full px-4 py-2 rounded-md font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-secondary disabled:cursor-not-allowed ${className}`}>
    {children}
  </button>
);

export const GeminiPanel = ({ onGenerate, isLoading }: GeminiPanelProps) => {
  const [prompt, setPrompt] = useState<string>('A recent graduate starting their first job in a new city. They feel excited but also anxious about leaving their friends and family behind. They are passionate about climate change and volunteer for a local organization. They recently went through a tough breakup.');

  const handleSubmit = () => {
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  return (
    <div className="glass-panel p-4 space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        Generate with AI
      </h3>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe a person, a character, or yourself..."
        className="w-full h-36 p-2 bg-input text-foreground rounded-md border border-border focus:ring-2 focus:ring-primary focus:outline-none resize-none"
        disabled={isLoading}
      />
      <Button onClick={handleSubmit} disabled={isLoading}>
        <div className="flex items-center justify-center gap-2">
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/50 border-t-primary-foreground rounded-full animate-spin"></div>
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Map
            </>
          )}
        </div>
      </Button>
    </div>
  );
};
