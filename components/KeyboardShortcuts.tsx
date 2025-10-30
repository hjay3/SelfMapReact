import React from 'react';
import { X } from 'lucide-react';

interface KeyboardShortcutsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { keys: ['Esc'], description: 'Clear selection / Close this dialog' },
  { keys: ['Click Node'], description: 'Select a node and its connections' },
  { keys: ['Drag'], description: 'Pan the visualization' },
  { keys: ['Scroll'], description: 'Zoom in and out' },
];

export const KeyboardShortcuts = ({ open, onOpenChange }: KeyboardShortcutsProps) => {
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-[fadeIn_0.2s_ease-out]"
      onClick={() => onOpenChange(false)}
    >
      <div 
        className="glass-panel w-full max-w-md m-4 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute top-3 right-3 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-semibold mb-2 text-foreground">Keyboard Shortcuts</h3>
        <p className="text-muted-foreground mb-6">Quick actions to navigate the map.</p>
        
        <div className="space-y-3">
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-foreground">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, keyIdx) => (
                  <kbd key={keyIdx} className="px-2 py-1 text-xs font-sans rounded-md bg-secondary text-secondary-foreground">
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};