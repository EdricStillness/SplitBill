import React from 'react';

type Props = {
  autoPlay?: boolean;
  loop?: boolean;
  source: any;
  style?: React.CSSProperties | any;
};

export default function Lottie(props: Props) {
  // Minimal web fallback to avoid heavy deps; styled div spinner
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', ...(props.style || {}) }}>
      <div style={{
        width: 40,
        height: 40,
        border: '4px solid #ccc',
        borderTopColor: '#555',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
    </div>
  );
}
