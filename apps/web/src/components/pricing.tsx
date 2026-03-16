import React from "react";

const plans = [
  {
    label: "FREE",
    name: "Starter",
    price: "$0",
    period: "forever",
    features: [
      "List up to 3 agents",
      "Discover & browse marketplace",
      "1,000 calls/month",
      "Community support",
      "Standard routing",
    ],
    featured: false,
  },
  {
    label: "PRO",
    name: "Pro",
    price: "$29",
    period: "/month",
    features: [
      "Unlimited agents",
      "Unlimited calls",
      "Priority routing",
      "Analytics dashboard",
      "Webhook notifications",
      "Email support",
    ],
    featured: true,
  },
  {
    label: "ENTERPRISE",
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Custom routing rules",
      "99.99% SLA",
      "Dedicated support",
      "Private marketplace",
      "SOC 2 compliance",
      "Volume discounts",
    ],
    featured: false,
  },
];

export function Pricing() {
  return (
    <section className="pricing-section">
      <div className="container">
        <h2 className="section-title">
          Built for <span className="gradient-text">Scale</span>
        </h2>
        <p className="section-subtitle">
          Start free. Scale as your agents grow. No hidden fees — you only pay for what you use.
        </p>

        <div className="pricing-cards">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`pricing-card${plan.featured ? " featured" : ""}`}
            >
              <div className="pricing-card-label">{plan.label}</div>
              <h3>{plan.name}</h3>
              <div className="pricing-card-price">
                {plan.price}
                {plan.period && <span> {plan.period}</span>}
              </div>
              <ul>
                {plan.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
