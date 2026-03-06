

export const SeaOtterLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Circle Background */}
    <circle cx="50" cy="50" r="50" fill="#2D3436" />
    
    {/* Ears */}
    <circle cx="30" cy="35" r="10" fill="#D7CCC8" />
    <circle cx="70" cy="35" r="10" fill="#D7CCC8" />
    
    {/* Face Shape */}
    <ellipse cx="50" cy="55" rx="35" ry="30" fill="#EFEBE9" />
    
    {/* Eyes */}
    <circle cx="40" cy="50" r="4" fill="#2D3436" />
    <circle cx="60" cy="50" r="4" fill="#2D3436" />
    
    {/* Nose */}
    <ellipse cx="50" cy="58" rx="6" ry="4" fill="#5D4037" />
    
    {/* Mouth */}
    <path d="M45 62 Q50 65 55 62" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
    
    {/* Cheeks */}
    <circle cx="35" cy="58" r="3" fill="#FFAB91" opacity="0.6" />
    <circle cx="65" cy="58" r="3" fill="#FFAB91" opacity="0.6" />
    
    {/* Letter/Envelope (held by otter) */}
    <rect x="35" y="75" width="30" height="20" rx="2" fill="#81D4FA" stroke="#2980B9" strokeWidth="2" />
    <path d="M35 75 L50 85 L65 75" stroke="#2980B9" strokeWidth="2" fill="none" />
  </svg>
);
