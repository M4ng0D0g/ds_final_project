import React from 'react';

const WarnIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 20 20">
    <path d="M10 2 L19 17 H1 Z" fill="#FFD600" stroke="#C89000" strokeWidth="1.2"/>
    <line x1="10" y1="8" x2="10" y2="13" stroke="#8B6000" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="10" cy="15.2" r="1" fill="#8B6000"/>
  </svg>
);

const CategoryCard = ({ cat, size, depth, onClick, onDetailClick }) => {
  const pct = (cat.earned / cat.required) * 100;
  const radius = size * 0.42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const planetStyle = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    background: `radial-gradient(circle at 36% 32%, ${cat.fromColor} 0%, ${cat.toColor} 72%)`,
    boxShadow: `0 8px 26px ${cat.toColor}66`,
    cursor: 'pointer',
    userSelect: 'none',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'box-shadow 0.3s ease',
  };

  const sheenStyle = {
    position: 'absolute',
    top: '12%',
    left: '16%',
    width: '44%',
    height: '30%',
    background: 'radial-gradient(ellipse, rgba(255,255,255,0.48) 0%, transparent 80%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  };

  const btnStyle = {
    position: 'absolute',
    bottom: '-45px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#FFF8E4',
    border: '2px solid #D4A820',
    borderRadius: '99px',
    padding: '6px 16px',
    fontSize: '12px',
    fontWeight: '800',
    color: '#8B6B00',
    cursor: 'pointer',
    opacity: Math.min(1, (depth + 0.1) * 2.5),
    display: depth > 0.05 ? 'block' : 'none',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  };

  return (
    <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
      <div 
        style={planetStyle} 
        onClick={() => onClick(cat.id)}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 4px rgba(255,255,255,.65), 0 12px 36px ${cat.toColor}99`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `0 8px 26px ${cat.toColor}66`;
        }}
      >
        <div style={sheenStyle} />
        
        {/* Progress Arc */}
        <svg 
          width={size} 
          height={size} 
          style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={Math.max(4, size * 0.043)}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth={Math.max(4, size * 0.043)}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>

        {/* Text content */}
        <div style={{ 
          zIndex: 1, 
          textAlign: 'center', 
          pointerEvents: 'none',
          width: '100%',
          padding: '12%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{ 
            fontSize: `${Math.max(10, size * 0.09)}px`, 
            fontWeight: 900, 
            color: '#fff', 
            textShadow: '0 1px 5px rgba(0,0,0,0.4)',
            lineHeight: 1.2,
            wordBreak: 'break-word',
            width: '100%'
          }}>
            {cat.title}
          </div>
          <div style={{ 
            fontSize: `${Math.max(8, size * 0.06)}px`, 
            color: 'rgba(255,255,255,0.7)',
            marginTop: '1px',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {cat.subtitle}
          </div>
          
          <div style={{
            marginTop: `${Math.max(3, size * 0.03)}px`,
            background: 'rgba(0,0,0,0.22)',
            borderRadius: '99px',
            padding: `${Math.max(1, size * 0.015)}px ${Math.max(5, size * 0.05)}px`,
            fontSize: `${Math.max(10, size * 0.09)}px`,
            fontWeight: 900,
            color: '#fff',
            display: 'inline-block'
          }}>
            {Math.round(pct)}%
          </div>

          {cat.status === 'alert' && (
            <div style={{ marginTop: '2px' }}>
              <WarnIcon size={Math.max(11, size * 0.1)} />
            </div>
          )}
        </div>
      </div>

      {/* Detail Button - Now outside planetStyle to ensure center purity */}
      <button 
        style={btnStyle}
        onClick={(e) => {
          e.stopPropagation();
          onDetailClick(cat.id);
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#FFEBB0'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#FFF8E4'; }}
      >
        查看明細
      </button>
    </div>
  );
};

export default CategoryCard;
