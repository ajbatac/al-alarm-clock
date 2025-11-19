import React, { useState, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { Upload, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';

const ImageAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(''); // Clear previous analysis
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;

    setIsLoading(true);
    try {
      // Using the vision model capability via the standard generateContent method
      const result = await geminiService.analyzeImage(image, "Describe what is in this image and how it might relate to sleep, relaxation, or waking up. Be creative.");
      setAnalysis(result);
    } catch (error) {
      setAnalysis("Failed to analyze image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 pb-24 space-y-6 h-full flex flex-col">
      <header>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ImageIcon className="text-purple-500" /> Vision Analysis
        </h2>
        <p className="text-slate-400">Upload a photo of your bedroom, breakfast, or morning view for AI insights.</p>
      </header>

      <div className="flex-1 flex flex-col items-center gap-6">
        {/* Image Preview Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`w-full h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${
            image ? 'border-purple-500/50 bg-slate-900' : 'border-slate-700 bg-slate-800 hover:bg-slate-750'
          }`}
        >
          {image ? (
            <img src={image} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <>
              <Upload className="w-10 h-10 text-slate-500 mb-2" />
              <span className="text-slate-400 font-medium">Tap to upload photo</span>
            </>
          )}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden" 
            accept="image/*"
          />
        </div>

        {/* Action Button */}
        {image && (
          <button 
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" /> Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> Analyze with AI
              </>
            )}
          </button>
        )}

        {/* Result Area */}
        {analysis && (
          <div className="w-full bg-slate-800 p-6 rounded-xl border border-purple-500/30 animate-fade-in">
            <h3 className="text-purple-400 font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Insights
            </h3>
            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
              {analysis}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalyzer;
