import './Skeleton.css';

export interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle';
  width?: number | string;
  height?: number | string;
  /** Number of text lines (variant "text" only). The last line is shorter. */
  lines?: number;
  className?: string;
}

/**
 * Placeholder shown while content loads.
 * Put aria-busy="true" on the container that holds the skeletons.
 */
export function Skeleton({
  variant = 'rect',
  width,
  height,
  lines = 1,
  className = '',
}: SkeletonProps) {
  if (variant === 'text') {
    return (
      <div className={`ks-skel-stack ${className}`} aria-hidden="true">
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className="ks-skel ks-skel--text"
            style={{ width: i === lines - 1 && lines > 1 ? '60%' : width ?? '100%' }}
          />
        ))}
      </div>
    );
  }

  const size = variant === 'circle' ? (width ?? height ?? 48) : undefined;
  return (
    <span
      className={`ks-skel ks-skel--${variant} ${className}`}
      style={{
        width: size ?? width ?? '100%',
        height: size ?? height ?? 96,
      }}
      aria-hidden="true"
    />
  );
}

export default Skeleton;
