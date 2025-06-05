
import React from 'react';

const AppHeader: React.FC = () => {
  return (
    <header className="py-4 px-6 text-center sticky top-0 z-10 glassmorphic mb-4 border-b-2 border-primary/70 shadow-[0_6px_25px_-8px_hsl(var(--primary)/0.6)]"> {/* Enhanced shadow and border opacity */}
      <h1 className="text-3xl md:text-4xl font-headline font-bold neon-text-primary tracking-wider">
        CodeVeda AI
      </h1>
    </header>
  );
};

export default AppHeader;
