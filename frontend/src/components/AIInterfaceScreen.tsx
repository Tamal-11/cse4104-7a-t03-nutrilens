import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, ImagePlus, Loader2, RefreshCw, AlertTriangle, Check, X, 
  Flame, Salad, Droplet, User, Sparkles, PieChart as ChartIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ScreenType, FoodAnalysis } from '../types';
import { NutriLenseLogo } from './NutriLenseLogo';
import {api} from '../services/api';

interface AIInterfaceScreenProps {
  onNavigate: (screen: ScreenType) => void;
  onAddHistory: (scan: FoodAnalysis) => void;
  selectedScan: FoodAnalysis | null;
}

export default function AIInterfaceScreen({ onNavigate, onAddHistory, selectedScan }: AIInterfaceScreenProps) {
  const [scanState, setScanState] = useState<'upload' | 'scanning' | 'results'>(
    selectedScan ? 'results' : 'upload'
  );
  
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [customFoodName, setCustomFoodName] = useState('');
  const [scanStep, setScanStep] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [uploadedAnalysis, setUploadedAnalysis] = useState<FoodAnalysis | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If a scan was loaded, show results
  useEffect(() => {
    if (selectedScan) {
      setScanState('results');
    }
  }, [selectedScan]);

  const scanningSteps = [
    'Initializing AI Vision Engine...',
    'Performing Multi-Spectra Nutrient Audit...',
    'Matching local food taxonomy databases...',
    'Calculating biological glycemic ratios...',
    'Extracting dietary allergen metrics...'
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (scanState === 'scanning') {
      setScanStep(0);
      interval = setInterval(() => {
        setScanStep((prev) => {
          return (prev + 1) % scanningSteps.length;
        });
      }, 600);
    }
    return () => clearInterval(interval);
  }, [scanState]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError('');
      setUploadedImageUrl(URL.createObjectURL(file));
      setScanState('scanning');
      try {
        const analysis = await api.analyzeImage(file);
        setUploadedAnalysis(analysis);
        onAddHistory(analysis);
        setScanState('results');
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Unable to analyze this image.');
        setScanState('upload');
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setScanState('upload');
    setUploadedImageUrl(null);
    setCustomFoodName('');
    setActiveIndex(null);
    setUploadedAnalysis(null);
  };

  // Determine actual food to show (using the selected historical item or default simulated mockup)
  const currentFood: FoodAnalysis = selectedScan || uploadedAnalysis || {
    id: 'simulated_chicken_rice',
    name: customFoodName || 'Chicken Rice',
    image: '🍗',
    time: 'Today, 12:45 PM',
    isHealthy: true,
    classification: 'Healthy',
    macros: {
      calories: 520,
      protein: 32,
      carbohydrates: 58,
      fat: 18,
      fiber: 4
    },
    pros: [
      'High Protein: Outstanding source of lean poultry protein supporting muscle synthesis.',
      'Rich Fiber: Crisp cucumber slices help moderate blood glycemic indices.'
    ],
    cons: [
      'High Sodium: Fried chicken seasonings carry heightened salt counts.',
      'Moderate Saturated Fats: Frying elements add to overall lipid ratios.'
    ],
    warnings: [
      'Elevated Sodium Level: We detected refined sodium elements exceeding 850mg.',
      'Potential Allergen: Accompanied soy sauces contain gluten.'
    ],
    suggestions: [
      'Ask for grilled meat and keep sauces on the side to restrict lipid retention.',
      'Drink sufficient water to counteract processed sodium spikes.'
    ],
    explanation: 'This classical Chicken Rice plate presents a rich load of highly biological muscle proteins but carries refined grains in the white starch rice. Pairing with the sliced cucumbers stimulates immediate trace dietary fiber absorption, making it a highly energetic workout meal.'
  };

  // Prepare dynamic pie data based on actual shown food macros
  const pieData = [
    { name: 'Protein', value: currentFood.macros.protein, color: '#4fa829' },
    { name: 'Carbs', value: currentFood.macros.carbohydrates, color: '#328cf0' },
    { name: 'Fat', value: currentFood.macros.fat, color: '#f04e32' }
  ];

  return (
    <div className="flex flex-col h-full bg-[#f2f8ed] text-slate-800 overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto flex flex-col flex-1 pb-6">
        
        {/* 1. Header Bar matching Image perfectly */}
        <div className="mx-4 mt-3 p-3 bg-white/95 rounded-[22px] shadow-[0_4px_20px_rgba(89,155,56,0.06)] border border-[#e2ebd8]/60 flex items-center justify-between">
        
        {/* Left side Logo */}
        <div className="flex items-center gap-1 cursor-pointer mx-auto sm:mx-0" onClick={() => onNavigate('dashboard')}>
          <NutriLenseLogo size={36} showText={true} textSizeClass="text-base font-extrabold tracking-tight text-slate-900" className="flex-row gap-1.5" />
        </div>
      </div>

      {/* Screen View Switcher animation */}
      <div className="flex-1 px-4 py-3 flex flex-col justify-start">
        <AnimatePresence mode="wait">

          {/* STATE 1: UPLOAD SCREEN IMAGE Uploader */}
          {scanState === 'upload' && (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col justify-center gap-4"
            >
              {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-semibold text-rose-700">{error}</div>}
              {/* Title Header with centered design with dividers as in image */}
              <div className="flex items-center justify-between my-2">
                <div className="flex-1 h-[1.5px] bg-[#d2ded1]"></div>
                <h3 className="px-5 text-xl font-bold text-[#1a1b1a] select-none uppercase tracking-wide">Food Analysis</h3>
                <div className="flex-1 h-[1.5px] bg-[#d2ded1]"></div>
              </div>

              {/* Dash-outlined Upload Zone Container */}
              <div className="w-full h-36 border-2 border-dashed border-[#8bb874] rounded-2xl bg-[#f7faf5] flex items-center justify-center p-4">
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  aria-label="Add a food photo"
                  title="Add a food photo"
                  className="flex flex-col items-center gap-2 text-[#599b38]"
                >
                  <span className="w-14 h-14 rounded-full bg-[#e8f3e2] hover:bg-[#dcefd2] flex items-center justify-center transition-colors">
                    <ImagePlus className="w-7 h-7" />
                  </span>
                  <span className="text-[10px] font-bold">Add photo</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              {/* Demo Quick selector option */}
              <div className="hidden">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Demo Quick Launch</span>
                <button
                  onClick={() => {
                    setCustomFoodName('Chicken Rice');
                    setScanState('scanning');
                  }}
                  className="w-full p-3.5 bg-[#599b38]/10 hover:bg-[#599b38]/20 border border-[#599b38]/30 rounded-xl text-left flex items-center justify-between transition group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🍗</span>
                    <div>
                      <strong className="block text-xs font-bold text-[#2e521b]">Chicken Rice Analysis (Image 4)</strong>
                      <span className="text-[9px] text-slate-400">Evaluate exactly the macronutrients, pros, and cons mockup</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#599b38] group-hover:underline">Simulate →</span>
                </button>
              </div>

            </motion.div>
          )}

          {/* STATE 2: SCANNING PROGRESS OVERLAY */}
          {scanState === 'scanning' && (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-6"
            >
              {/* Spinning leaf wheel or loading ring */}
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-[#eaf4df] border-t-[#599b38] animate-spin"></div>
                <Sparkles className="w-8 h-8 text-[#599b38] animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Vision System Auditing</h4>
                <p className="text-[10px] text-slate-400 font-mono mt-1.5">{scanningSteps[scanStep]}</p>
              </div>
            </motion.div>
          )}

          {/* STATE 3: RESULTS PRESENTATION (UNIFIED COMPREHENSIVE VIEW!) */}
          {scanState === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col gap-4"
            >
              
              {/* Title Header with centered design with dividers as in image */}
              <div className="flex items-center justify-between my-1">
                <div className="flex-1 h-[1.5px] bg-[#d2ded1]"></div>
                <h3 className="px-4 text-sm font-black text-[#1a1b1a] select-none uppercase tracking-wider">Unified Food Report</h3>
                <div className="flex-1 h-[1.5px] bg-[#d2ded1]"></div>
              </div>

              {/* Top Quick action upload shortcut */}
              <div 
                onClick={handleReset}
                className="w-full py-2.5 border border-dashed border-[#8bb874]/60 rounded-xl bg-white hover:bg-[#fafdf8] transition text-[10px] font-bold text-[#599b38] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload / Scan Another Plate</span>
              </div>

              {/* High Quality Food Photo */}
              <div className="w-full h-44 rounded-[20px] overflow-hidden shadow-xs relative bg-white border border-[#e2edd8]">
                <img 
                  src={uploadedImageUrl || (currentFood.id.startsWith('p') ? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80" : "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80")}
                  alt={currentFood.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Detected food list card */}
              <div className="bg-[#f2f8ed] border border-[#e4eedc] rounded-2xl p-4 grid grid-cols-2 gap-3 shadow-xs">
                
                {/* Left Column: Detected Food name */}
                <div className="flex flex-col justify-center pr-3 border-r border-[#d4ded0]">
                  <span className="text-[10px] text-slate-400 font-bold tracking-tight uppercase">Detected Food:</span>
                  <span className="text-[#3c761e] text-xl font-black leading-tight mt-1 select-all">{currentFood.name}</span>
                </div>

                {/* Right Column: Key macro stats listing with custom icons next to them */}
                <div className="flex flex-col gap-1.5 pl-2 justify-center text-[11px] font-bold text-slate-700">
                  
                  <div className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-[#599b38] fill-current" />
                    <span>Calories : <span className="font-extrabold text-slate-900">{currentFood.macros.calories} kcal</span></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Salad className="w-3.5 h-3.5 text-[#599b38]" />
                    <span>Protein : <span className="font-extrabold text-slate-900">{currentFood.macros.protein} g</span></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-[#599b38]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 3v18M12 3a9 9 0 019 9M12 3a9 9 0 00-9 9m18 0a9 9 0 01-9 9m9-9H3m15 0a6 6 0 10-12 0" />
                    </svg>
                    <span>Carbs : <span className="font-extrabold text-slate-900">{currentFood.macros.carbohydrates} g</span></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Droplet className="w-3.5 h-3.5 text-[#599b38] fill-current" />
                    <span>Fat : <span className="font-extrabold text-slate-900">{currentFood.macros.fat} g</span></span>
                  </div>
                </div>
              </div>

              {/* Interactive Nutrition Pie Chart Panel */}
              <div className="bg-white p-4.5 border border-[#e2edd8] rounded-[24px] shadow-[0_4px_16px_rgba(89,155,56,0.03)] flex flex-col items-center">
                <span className="text-[10px] font-bold text-[#558e38] bg-[#f4f8f1] px-3 py-1 rounded-full uppercase tracking-wider mb-2 flex items-center gap-1">
                  <ChartIcon className="w-3.5 h-3.5 text-[#558e38]" /> Macronutrient Distribution
                </span>

                {/* Pie Chart display containing labels drawn on the side of each wedge portion */}
                <div className="w-full h-48 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, bottom: 10, left: 15, right: 15 }}>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={44}
                        outerRadius={60}
                        paddingAngle={4}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        onClick={(_, index) => setActiveIndex(index)}
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        label={({ name, value }) => `${name}: ${value}g`}
                        labelLine={{ stroke: '#8bb874', strokeWidth: 1.2 }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color}
                            stroke={activeIndex === index ? '#1e251b' : 'transparent'}
                            strokeWidth={activeIndex === index ? 2.5 : 0}
                            className="outline-none cursor-pointer transition-all duration-200"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Central stats text - Calories representation */}
                  <div className="absolute text-center flex flex-col justify-center pointer-events-none select-none z-10">
                    <span className="text-xl font-black text-slate-800 leading-none">{currentFood.macros.calories}</span>
                    <span className="text-[7.5px] font-black text-slate-400 mt-1 uppercase tracking-widest">KCAL</span>
                  </div>
                </div>

                {/* Dynamic highlighted interactive legend list displaying exact amounts on side */}
                <div className="w-full flex flex-col gap-2 mt-2 px-1">
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block text-center mb-1">
                    Touch any color portion above to inspect:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {pieData.map((x, i) => {
                      const isSelected = activeIndex === i;
                      return (
                        <div 
                          key={i} 
                          onClick={() => setActiveIndex(i)}
                          className={`p-1.5 px-2 rounded-xl text-center border cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? 'bg-[#edf6e8] border-[#8bb874] shadow-xs scale-102 font-black text-slate-900' 
                              : 'bg-slate-50/50 border-slate-100 hover:bg-[#fafdf8] text-slate-500 font-semibold'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5 mb-0.5">
                            <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0" style={{ backgroundColor: x.color }}></span>
                            <span className="text-[9px] uppercase tracking-wider">{x.name}</span>
                          </div>
                          <span className="text-xs font-black text-slate-800">
                            {x.value}g
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pros and Cons table panel */}
              <div className="bg-white rounded-[24px] border border-[#e2edd8] p-4.5 grid grid-cols-2 gap-4 shadow-[0_4px_20px_rgba(89,155,56,0.02)]">
                
                {/* Left Column: Pros */}
                <div className="pr-1 border-r border-[#ebf1e8]">
                  
                  {/* Pros title */}
                  <div className="flex items-center gap-2 text-[#529031] font-bold text-xs mb-3">
                    <div className="w-5 h-5 rounded-full bg-[#e8f4e2] flex items-center justify-center text-[#529031]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="font-extrabold uppercase tracking-wider">Pros</span>
                  </div>

                  {/* Items */}
                  <div className="flex flex-col gap-2.5">
                    {currentFood.pros.map((pro, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-emerald-600 font-bold shrink-0 text-xs mt-0.5">✓</span>
                        <span className="text-[10px] font-semibold text-slate-600 leading-tight">{pro}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Cons */}
                <div className="pl-1">
                  
                  {/* Cons title */}
                  <div className="flex items-center gap-2 text-[#cc3a3a] font-bold text-xs mb-3">
                    <div className="w-5 h-5 rounded-full bg-[#faeeee] flex items-center justify-center text-[#cc3a3a]">
                      <X className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="font-extrabold uppercase tracking-wider">Cons</span>
                  </div>

                  {/* Items */}
                  <div className="flex flex-col gap-2.5">
                    {currentFood.cons.map((con, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-rose-600 font-bold shrink-0 text-xs mt-0.5">✗</span>
                        <span className="text-[10px] font-semibold text-slate-600 leading-tight">{con}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Diagnostic warnings and medical indicators */}
              {currentFood.warnings && currentFood.warnings.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/80 flex gap-3 shadow-xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    <span className="font-extrabold text-amber-800 block uppercase tracking-wide text-[9px] mb-1">AI Dietitian Warnings & Suggestions</span>
                    <ul className="list-disc pl-3 mt-1.5 space-y-1.5 text-slate-600 font-semibold">
                      {currentFood.warnings.map((warn, i) => (
                        <li key={i} className="text-[10px]">{warn}</li>
                      ))}
                      {currentFood.suggestions && currentFood.suggestions.map((sug, i) => (
                        <li key={`sug-${i}`} className="text-[10px] text-teal-850 list-none font-bold italic text-[#2c5c16]">+ {sug}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* AI Interaction statement explanation */}
              <div className="bg-white p-4.5 rounded-2xl border border-[#e2edd8] text-[11px] leading-relaxed text-slate-600 font-semibold shadow-xs">
                <span className="font-extrabold text-slate-800 block mb-1 uppercase tracking-wider text-[9px] text-[#426a2e]">Meal Synthesis Summary</span>
                <p className="mt-1 text-slate-500 font-medium">{currentFood.explanation}</p>
              </div>

              {/* Center Clean Action Button: Analyze Another Plate */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleReset}
                className="w-full mt-2 mb-4 py-3.5 bg-[#599b38] hover:bg-[#487e2d] text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                <span>Reset & Analyze New Plate</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </div>
  );
}
