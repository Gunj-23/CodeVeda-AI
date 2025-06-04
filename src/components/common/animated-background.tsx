"use client";

import React, { useEffect, useState } from 'react';

interface Star {
  id: number;
  x: string;
  y: string;
  size: string;
  animationDuration: string;
  animationDelay: string;
}

const AnimatedBackground: React.FC = () => {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const numStars = 50; // Adjust for more/less stars
    const newStars: Star[] = [];
    for (let i = 0; i < numStars; i++) {
      newStars.push({
        id: i,
        x: `${Math.random() * 100}%`,
        y: `${Math.random() * 100}%`,
        size: `${Math.random() * 2 + 1}px`, // Star size between 1px and 3px
        animationDuration: `${Math.random() * 3 + 2}s`, // Duration between 2s and 5s
        animationDelay: `${Math.random() * 2}s`, // Delay up to 2s
      });
    }
    setStars(newStars);
  }, []);

  return (
    <div className="animated-bg">
      {stars.map(star => (
        <div
          key={star.id}
          className="star"
          style={{
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            animationName: 'starShine', // Ensure this matches Tailwind keyframes
            animationDuration: star.animationDuration,
            animationDelay: star.animationDelay,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;
