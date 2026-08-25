import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { LandingHeader } from './LandingHeader';
import { HeroSection } from './HeroSection';
import { DecisionClaritySection } from './DecisionClaritySection';
import { PlansSection } from './PlansSection';
import { MegaCtaAndFooter } from './MegaCtaAndFooter';
import { AuthAndLeadModals } from './AuthAndLeadModals';

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const navigate = useNavigate();
  
  // Modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // User state
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [currentUserPortalLink, setCurrentUserPortalLink] = useState<string>('');

  // Dark Mode state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('animasystem_theme');
    return saved === 'dark';
  });

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('animasystem_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Global Settings State from Firestore
  const [brandName, setBrandName] = useState('AnimaSystem');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const q = query(collection(db, 'clients'), where('authUid', '==', user.uid));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const clientData = snap.docs[0].data();
            const firstName = clientData.clientFirstName || clientData.responsible?.split(' ')[0] || 'Cliente';
            setCurrentUserName(firstName);
            setCurrentUserPortalLink(`/cliente/${snap.docs[0].id}`);
          } else {
            const name = user.displayName?.split(' ')[0] || (user.email === 'danielvaleweb@gmail.com' ? 'Daniel' : 'Admin');
            setCurrentUserName(name);
            setCurrentUserPortalLink('/admin');
          }
        } catch (err) {
          console.error("Error fetching user details in landing page", err);
          setCurrentUserName(user.displayName?.split(' ')[0] || 'Admin');
          setCurrentUserPortalLink('/admin');
        }
      } else {
        setCurrentUser(null);
        setCurrentUserName('');
        setCurrentUserPortalLink('');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.brandName) setBrandName(data.brandName);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleOpenTrial = () => {
    navigate('/trial');
  };

  const handleScrollToAi = () => {
    const el = document.getElementById('ia-first');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-[#D7FE03] selection:text-black antialiased transition-colors duration-500 ${
      isDarkMode ? 'bg-[#070709] text-white' : 'bg-[#F8F9FA] text-slate-900'
    }`}>
      
      {/* 1. Header Navigation */}
      <LandingHeader
        brandName={brandName}
        currentUser={currentUser}
        currentUserName={currentUserName}
        currentUserPortalLink={currentUserPortalLink}
        onOpenLoginModal={() => setIsAuthModalOpen(true)}
        onOpenDemoModal={handleOpenTrial}
        isDarkMode={isDarkMode}
      />

      {/* 2. AI First Hero Section with HUD Telemetry & Theme Switcher */}
      <HeroSection
        onOpenDemoModal={handleOpenTrial}
        onScrollToAi={handleScrollToAi}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* 3. Decision Clarity & Growth - Sobre Nós Intro Section */}
      <DecisionClaritySection
        onOpenDemoModal={handleOpenTrial}
        isDarkMode={isDarkMode}
      />

      {/* 4. Plans & Pricing Table */}
      <PlansSection
        onOpenRegisterModal={() => setIsAuthModalOpen(true)}
        onOpenDemoModal={handleOpenTrial}
      />

      {/* 5. Footer */}
      <MegaCtaAndFooter
        brandName={brandName}
        onOpenDemoModal={handleOpenTrial}
        onOpenLoginModal={() => setIsAuthModalOpen(true)}
      />

      {/* 6. Full Authentication & Demo Schedule Modals */}
      <AuthAndLeadModals
        isAuthModalOpen={isAuthModalOpen}
        onCloseAuthModal={() => setIsAuthModalOpen(false)}
        isDemoModalOpen={isDemoModalOpen}
        onCloseDemoModal={() => setIsDemoModalOpen(false)}
        onSuccessAuth={onEnter}
      />

    </div>
  );
}
