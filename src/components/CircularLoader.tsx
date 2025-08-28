'use client'

interface CircularLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function CircularLoader({ size = 'md', className = '' }: CircularLoaderProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8', 
    lg: 'w-16 h-16'
  }

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="relative w-full h-full">
        <svg className="animate-spin w-full h-full" viewBox="0 0 50 50">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="31.416"
            strokeDashoffset="31.416"
            className="opacity-20"
          />
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="31.416"
            strokeDashoffset="8"
            className="animate-pulse"
            style={{
              stroke: 'url(#gradient)',
              animation: 'spin 1.5s linear infinite, dash 1.5s ease-in-out infinite'
            }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      <style jsx>{`
        @keyframes dash {
          0% {
            stroke-dasharray: 1, 150;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -35;
          }
          100% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -124;
          }
        }
      `}</style>
    </div>
  )
}