import React from "react";
import { Hero } from "../components/hero";
import { Vision } from "../components/vision";
import { Architecture } from "../components/architecture";
import { Playground } from "../components/playground";
import { Marketplace } from "../components/marketplace";
import { HowItWorks } from "../components/how-it-works";
import { ForBuilders } from "../components/for-builders";
import { Quickstart } from "../components/quickstart";
import { Pricing } from "../components/pricing";
import { CTA } from "../components/cta";
import { Footer } from "../components/footer";

export default function LandingPage() {
  return (
    <main className="grid-bg">
      <Hero />
      <Vision />
      <Architecture />
      <Playground />
      <Marketplace />
      <HowItWorks />
      <ForBuilders />
      <Quickstart />
      <Pricing />
      <CTA />
      <Footer />
    </main>
  );
}
