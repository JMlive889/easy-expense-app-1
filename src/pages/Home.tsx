import { useState, useEffect } from 'react';
import Navigation from '../components/landing/Navigation';
import StickyBanner from '../components/landing/StickyBanner';
import Hero from '../components/landing/Hero';
import VideoHero from '../components/landing/VideoHero';
import ThreeMainFunctions from '../components/landing/ThreeMainFunctions';
import FeatureShowcase from '../components/landing/FeatureShowcase';
import Features from '../components/landing/Features';
import Differentiation from '../components/landing/Differentiation';
import ComingSoon from '../components/landing/ComingSoon';
import SocialProof from '../components/landing/SocialProof';
import PricingSection from '../components/landing/PricingSection';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';

interface HomeProps {
  onNavigate?: (page: 'landing') => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-bg-black text-white' : 'bg-white text-gray-900'}`}>
      <Navigation darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <StickyBanner darkMode={darkMode} />
      <Hero />
      <VideoHero />
      <ThreeMainFunctions />
      <FeatureShowcase />
      <Features />
      <Differentiation />
      <ComingSoon />
      <SocialProof />
      <PricingSection />
      <CTASection />
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
