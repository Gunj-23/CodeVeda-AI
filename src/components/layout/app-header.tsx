import React from 'react';

const AppHeader: React.FC = () => {
  return (
    <header className="py-4 px-6 text-center sticky top-0 z-10 glassmorphic mb-4">
      <h1 className="text-3xl md:text-4xl font-headline font-bold neon-text-primary tracking-wider">
        CodeVeda AI
      </h1>
    </header>
  );
};

export default AppHeader;
