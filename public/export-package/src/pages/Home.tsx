import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import StickyBanner from '../components/StickyBanner';
import Hero from '../components/Hero';
import VideoHero from '../components/VideoHero';
import ThreeMainFunctions from '../components/ThreeMainFunctions';
import FeatureShowcase from '../components/FeatureShowcase';
import Features from '../components/Features';
import Differentiation from '../components/Differentiation';
import ComingSoon from '../components/ComingSoon';
import SocialProof from '../components/SocialProof';
import PricingSection from '../components/PricingSection';
import CTASection from '../components/CTASection';
import Footer from '../components/Footer';

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (location.state?.scrollTo) {
      setTimeout(() => {
        const element = document.getElementById(location.state.scrollTo);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location]);

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
      <Footer />
    </div>
  );
}
