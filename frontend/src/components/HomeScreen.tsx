import { motion } from 'motion/react';
import { ScreenType } from '../types';
import { NutriLenseLogo, LeafyBackgroundDecorations } from './NutriLenseLogo';

interface HomeScreenProps {
  onNavigate: (screen: ScreenType) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-6 py-12 bg-gradient-to-b from-[#daefcc] to-[#f3f9f0] text-slate-800 overflow-hidden">
      
      {/* Absolute Leafy background decals matching the screenshot */}
      <LeafyBackgroundDecorations />

      {/* Main Branding Section */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 max-w-sm text-center">
        
        {/* Animated Camera Logo & Title */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, type: 'spring' }}
          className="flex flex-col items-center"
        >
          {/* Main big logo matching the mockups exactly */}
          <NutriLenseLogo 
            size={180} 
            showText={true} 
            textSizeClass="text-5xl font-extrabold tracking-tight text-neutral-900 mt-5 select-none"
          />
        </motion.div>

        {/* Tagline under logo matching screen 3 exactly */}
        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="text-lg font-medium text-[#4b5545] tracking-wide mt-4 select-none"
        >
          Snap a meal, know the deal
        </motion.p>
      </div>

      {/* Primary CTA button matching screen 3 exactly */}
      <div className="relative z-10 w-full max-w-xs flex flex-col items-center mb-8">
        <motion.button
          id="btn-get-started"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onNavigate('login')}
          className="py-3.5 px-8 text-center text-white bg-[#121612] hover:bg-neutral-900 font-bold tracking-wide rounded-full shadow-lg shadow-neutral-950/15 cursor-pointer transition-all flex items-center justify-center gap-2"
        >
          Get Started
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            →
          </motion.span>
        </motion.button>
      </div>
    </div>
  );
}
