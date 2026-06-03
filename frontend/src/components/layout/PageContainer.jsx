import React from 'react';

export default function PageContainer({ children }) {
  return (
    <main className="page-container animate-fade-in">
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </div>
    </main>
  );
}
