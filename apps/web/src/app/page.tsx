import React from "react";
import { Hero } from "../components/hero.js";
import { HowItWorks } from "../components/how-it-works.js";
import { ForSellers } from "../components/for-sellers.js";
import { ForAgents } from "../components/for-agents.js";
import { Footer } from "../components/footer.js";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <ForSellers />
      <ForAgents />
      <Footer />
    </>
  );
}
