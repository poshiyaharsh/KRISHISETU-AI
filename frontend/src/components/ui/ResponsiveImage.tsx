import React from 'react';

export interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  aspectRatio?: '16/9' | '4/3' | '1/1' | 'auto';
  blurPlaceholder?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
  className?: string;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  alt,
  aspectRatio = '16/9',
  blurPlaceholder,
  fetchPriority = 'auto',
  className = '',
  width,
  height,
  loading = 'lazy',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);

  const aspectStyles: Record<string, string> = {
    '16/9': 'aspect-[16/9]',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
    auto: '',
  };

  return (
    <div
      className={`relative overflow-hidden bg-surface-sunken ${aspectStyles[aspectRatio]} ${className}`}
    >
      {blurPlaceholder && !isLoaded && (
        <img
          src={blurPlaceholder}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover filter blur-sm scale-105"
        />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
