
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CarmartPerthDifference from "@/components/CarmartPerthDifference";
import GoogleReviewsSection from "@/components/GoogleReviewsSection";
import FAQSection from "@/components/FAQSection";
import FinanceCTASection from "@/components/FinanceCTASection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      {/* Public Website Navbar */}
      <Navbar />

      {/* Main Website Content */}
      <main className="min-h-screen bg-[#0b1320] pt-20 text-[#151515]">
        {/* Hero and Statistics */}
        <HeroSection />

        {/* Why Choose Carmart Perth */}
        <CarmartPerthDifference />

        {/* Customer Reviews */}
        <GoogleReviewsSection />

        {/* Frequently Asked Questions */}
        <FAQSection />

        {/* Finance Application CTA */}
        <FinanceCTASection />
      </main>

      {/* Website Footer */}
      <Footer />
    </>
  );
}
