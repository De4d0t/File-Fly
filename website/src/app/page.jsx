import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import AppMockup from '../components/AppMockup';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import DownloadSection from '../components/DownloadSection';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <AppMockup />
        <Features />
        <HowItWorks />
        <DownloadSection />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
