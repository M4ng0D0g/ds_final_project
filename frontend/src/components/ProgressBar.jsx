import { useState, useEffect } from 'react';

const ProgressBar = ({ pct = 0, color = "#C93638", height = 5 }) => {
  const [barW, setBarW] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setBarW(pct), 150);
    return () => clearTimeout(t);
  }, [pct]);

  const containerStyle = {
    height: `${height}px`,
    background: 'rgba(0,0,0,0.1)', // Default background if not specified in parent
    borderRadius: '99px',
    overflow: 'hidden',
    width: '100%',
  };

  const fillStyle = {
    height: '100%',
    width: `${barW}%`,
    background: color,
    borderRadius: '99px',
    transition: 'width 1.1s cubic-bezier(.23,1,.32,1)',
  };

  return (
    <div style={containerStyle}>
      <div style={fillStyle} />
    </div>
  );
};

export default ProgressBar;
