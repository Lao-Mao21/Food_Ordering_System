import React, { useState, useEffect } from 'react';
import * as FaIcons from 'react-icons/fa6';
import { Icon, LoadingSpinner } from './index';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackIcon?: keyof typeof FaIcons;
  containerClassName?: string;
  aspectRatio?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  customSize?: string;
}

const sizeClasses = {
  xs: 'w-12 h-12',
  sm: 'w-20 h-20',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
  xl: 'w-64 h-64',
  full: 'w-full h-full',
};

export const Image: React.FC<ImageProps> = ({
  src,
  alt = "image description",
  fallbackIcon = "FaImage",
  className = "",
  containerClassName = "",
  aspectRatio = "aspect-auto",
  size = 'full',
  customSize = '',
  ...props
}) => {

  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    setStatus('loading');
  }, [src]);

  const dimensionClass = customSize || sizeClasses[size];

  return (
    <div
      className={`
        relative overflow-hidden bg-main-bg border border-border rounded-2xl
        ${dimensionClass}
        ${aspectRatio}
        ${containerClassName}
      `}
    >
      {/* Loading */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface">
          <LoadingSpinner size="sm" />
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted bg-surface">
          <Icon iconName={fallbackIcon} size={28} />
          <span className="text-[10px] font-black uppercase italic tracking-tighter">
            Image Unavailable
          </span>
        </div>
      )}

      {/* Image */}
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`
            w-full h-full object-cover transition-all duration-500
            ${status === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
            ${className}
          `}
          {...props}
        />
      )}
    </div>
  );
};

export default Image;