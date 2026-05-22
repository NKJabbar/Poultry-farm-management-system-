import React from "react";
import logoImg from "../assets/images/chicken_logo_1779454382872.png";

interface FlockIntelLogoProps {
  className?: string;
  showText?: boolean;
  textLight?: boolean; // Can be manually set to true to force white text (e.g. in the dark sidebar)
  size?: "sm" | "md" | "lg" | "xl";
}

export const FlockIntelLogo: React.FC<FlockIntelLogoProps> = ({
  className = "",
  showText = false,
  textLight,
  size = "md",
}) => {
  // Size dimensions for the logo icon
  const dims = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-24 h-24",
  };

  const selectedSizeClass = dims[size] || className;

  // Determine text color class
  const textClass = textLight === true 
    ? "text-white" 
    : textLight === false 
      ? "text-slate-900" 
      : "text-slate-900 dark:text-white";

  return (
    <div id="flockintel-logo" className={`flex items-center gap-3 ${className}`}>
      {/* High-Resolution displays the uploaded image directly (un-cropped, pure) */}
      <div 
        className={`${selectedSizeClass} shrink-0 select-none overflow-hidden rounded-full flex items-center justify-center p-0.5 bg-white border border-slate-250/20 shadow-xs`}
      >
        <img
          src={`${logoImg}?v=3`}
          alt="FlockIntel Logo"
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* FlockIntel BRAND TEXT */}
      {showText && (
        <div className="flex flex-col select-none">
          <div className="flex items-baseline font-display tracking-tight text-lg font-bold leading-none">
            <span className={textClass}>
              Flock
            </span>
            <span className="text-emerald-500 font-extrabold">Intel</span>
          </div>
          <span className="text-[9px] text-emerald-500/90 dark:text-emerald-400 font-bold tracking-wider uppercase mt-1 leading-none">
            Predictive Poultry AI
          </span>
        </div>
      )}
    </div>
  );
};
