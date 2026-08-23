import React, { useEffect } from 'react';
import { SplashAnimation } from '@shared/ui';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    // Minimum splash duration (2.5 seconds) then finish
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return <SplashAnimation />;
}
