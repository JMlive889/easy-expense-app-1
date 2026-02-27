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
  onNavigate?: (page: string) => void;
  scrollTarget?: string | null;
}

export default function Home({ onNavigate, scrollTarget }: HomeProps) {
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
    localStorage.setItem('theme_preference', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (!scrollTarget) return;
    const attemptScroll = (attemptsLeft: number) => {
      const element = document.getElementById(scrollTarget);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      } else if (attemptsLeft > 0) {
        setTimeout(() => attemptScroll(attemptsLeft - 1), 100);
      }
    };
    attemptScroll(10);
  }, [scrollTarget]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-bg-black text-white' : 'bg-white text-gray-900'}`}>
      <Navigation darkMode={darkMode} toggleDarkMode={toggleDarkMode} onNavigate={onNavigate} />
      <StickyBanner darkMode={darkMode} onNavigate={onNavigate} />
      <div id="home">
        <Hero onNavigate={onNavigate} />
      </div>
      <VideoHero />
      <ThreeMainFunctions />
      <FeatureShowcase />
      <div id="features">
        <Features />
      </div>
      <Differentiation />
      <ComingSoon />
      <SocialProof />
      <div id="pricing">
        <PricingSection onNavigate={onNavigate} />
      </div>
      <div id="support">
        <CTASection />
      </div>
      <Footer onNavigate={onNavigate} darkMode={darkMode} />
    </div>
  );
}
