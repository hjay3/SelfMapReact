import React, { useState, useCallback, useMemo } from 'react';
import { SelfMapData, SizeMetric, RadiusMode } from './types/selfmap';
import { DEFAULT_DATA } from './data/sample';
import { SelfMapVisualization } from './components/SelfMapVisualization';
import { ControlPanel } from './components/ControlPanel';
import { GeminiPanel } from './components/GeminiPanel';
import { generateSelfMapData } from './services/geminiService';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { Github, X } from 'lucide-react';

const App = () => {
  const [data, setData] = useState<SelfMapData>(DEFAULT_DATA);
  const [sizeMetric, setSizeMetric] = useState<SizeMetric>('power_x_val');
  const [radiusMode, setRadiusMode] = useState<RadiusMode>('valence');
  const [showEdges, setShowEdges] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [sizeScale, setSizeScale] = useState<number>(1.0);
  const [opacity, setOpacity] = useState<number>(0.9);
  const [pulsationMode, setPulsationMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const jsonData = JSON.parse(content);
          
          // Add basic validation for the JSON structure
          if (Array.isArray(jsonData.entries) && Array.isArray(jsonData.associations)) {
            setData(jsonData);
            setError(null);
          } else {
            throw new Error("Invalid Self Map data structure in JSON file.");
          }
        } catch (err: any) {
          setError(err.message || 'Failed to parse JSON file.');
          console.error(err);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleGenerate = useCallback(async (prompt: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newData = await generateSelfMapData(prompt);
      setData(newData);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredData = useMemo(() => {
    // This is where filtering logic would go if search/filter controls were added
    return data;
  }, [data]);

  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col font-sans">
      <header className="flex items-center justify-between p-4 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Self Map AI Visualizer</h1>
        <a href="https://github.com/google/genai-js" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
          <Github />
        </a>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 p-4 overflow-hidden">
        <div className="flex flex-col gap-4 overflow-y-auto pr-2">
          {error && (
            <div className="bg-destructive text-destructive-foreground p-3 rounded-md flex justify-between items-center">
              <span className="text-sm"><strong>Error:</strong> {error}</span>
              <button onClick={() => setError(null)} className="p-1 rounded-full hover:bg-destructive/80">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <GeminiPanel onGenerate={handleGenerate} isLoading={isLoading} />
          <ControlPanel
            sizeMetric={sizeMetric}
            onSizeMetricChange={setSizeMetric}
            radiusMode={radiusMode}
            onRadiusModeChange={setRadiusMode}
            showEdges={showEdges}
            onShowEdgesChange={setShowEdges}
            showLabels={showLabels}
            onShowLabelsChange={setShowLabels}
            sizeScale={sizeScale}
            onSizeScaleChange={setSizeScale}
            opacity={opacity}
            onOpacityChange={setOpacity}
            pulsationMode={pulsationMode}
            onPulsationModeChange={setPulsationMode}
            onFileUpload={handleFileUpload}
            onLoadSample={() => { setData(DEFAULT_DATA); setError(null); }}
            onShowHelp={() => setShowHelp(true)}
          />
        </div>
        
        <div className="glass-panel w-full h-full min-h-[600px] lg:min-h-0">
          <SelfMapVisualization
            entries={filteredData.entries}
            associations={filteredData.associations}
            sizeMetric={sizeMetric}
            radiusMode={radiusMode}
            showEdges={showEdges}
            showLabels={showLabels}
            sizeScale={sizeScale}
            opacity={opacity}
            pulsationMode={pulsationMode}
          />
        </div>
      </main>
      <KeyboardShortcuts open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
};

export default App;