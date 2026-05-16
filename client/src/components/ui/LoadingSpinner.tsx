import React from "react";

type SpinnerSize = "sm" | "md" | "lg" | "xlg" | "custom";

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  customSize?: string;
  color?: string;
  bg?: string;
  height?: string;
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  customSize = "",
  color = "text-primary",
  bg = "bg-transparent",
  height = "",
  text = "",
  className = "",
}) => {
  const sizeClasses: Record<Exclude<SpinnerSize, "custom">, string> = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xlg: "w-16 h-16",
  };

  const currentSizeClass = size === "custom" ? customSize : sizeClasses[size];

  return (
    <div className={`flex flex-row items-center justify-center gap-2 ${height} ${bg} ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className={`${currentSizeClass} ${color} border-2 rounded-full animate-spin border-t-transparent border-current aspect-square`} />
      </div>

      {text && (
        <span className="text-xs font-bold tracking-[0.15em] uppercase whitespace-nowrap">
          {text}
        </span>
      )}
    </div>
  );
};


export default LoadingSpinner;