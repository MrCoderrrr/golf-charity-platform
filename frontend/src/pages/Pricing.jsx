import { useState } from "react";

const tiers = [
  {
    name: "Basic",
    monthly: 999,
    yearly: 9999,
    highlight: "Starter momentum",
    perks: ["Unlimited scores", "Standard draw odds", "Support in 24h"],
  },
  {
    name: "Pro",
    monthly: 2499,
    yearly: 24999,
    highlight: "Best value",
    perks: ["Unlimited scores", "Priority support", "Enhanced draw odds", "Impact reports"],
    featured: true,
  },
  {
    name: "Elite",
    monthly: 4999,
    yearly: 49999,
    highlight: "Concierge",
    perks: ["Unlimited team seats", "Concierge verification", "Custom charity splits", "Early access drops"],
  },
];

const Pricing = () => {
  const [billing, setBilling] = useState({
    Basic: "monthly",
    Pro: "monthly",
    Elite: "monthly",
  });

  const formatINR = (n) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="pricing-shell">
      <div className="pricing-head">
        <div>
          <h2 className="premium-serif pricing-title gold-leaf-heading">Pricing plans</h2>
          <p className="pricing-sub">Choose the plan that’s right for you.</p>
        </div>
      </div>

      <div className="pricing-grid">
        {tiers.map((tier) => {
          const isBasic = tier.name === "Basic";
          const isPro = tier.name === "Pro";
          const priceClass = isBasic
            ? "plan-price-basic"
            : isPro
            ? "plan-price-pro"
            : "gold-leaf-text";
          const nameClass = isBasic
            ? "plan-name plan-name-basic"
            : isPro
            ? "plan-name plan-name-pro"
            : "plan-name plan-name-elite";
          const glowClass =
            tier.name === "Elite" && billing[tier.name] === "yearly" ? "plan-glow" : "";

          return (
            <div
              key={tier.name}
              className={`plan-card ${tier.featured ? "plan-featured" : ""} ${glowClass}`}
            >
              <div className="plan-top">
                <div className="plan-name-row">
                  <span className={nameClass}>{tier.name}</span>
                  {tier.featured && <span className="plan-chip">Recommended</span>}
                </div>
                <div className="plan-billing" role="group" aria-label="Billing cadence">
                  {["monthly", "yearly"].map((cadence) => (
                    <button
                      key={cadence}
                      type="button"
                      className={`billing-pill ${
                        billing[tier.name] === cadence ? "billing-pill--active" : ""
                      } ${cadence === "yearly" ? "billing-pill--yearly" : ""}`}
                      aria-pressed={billing[tier.name] === cadence}
                      onClick={() =>
                        setBilling((prev) => ({ ...prev, [tier.name]: cadence }))
                      }
                    >
                      {cadence === "monthly" ? "Monthly" : "Yearly"}
                    </button>
                  ))}
                </div>
                <div className="plan-price">
                  <span className={priceClass}>
                    {billing[tier.name] === "monthly"
                      ? formatINR(tier.monthly)
                      : formatINR(tier.yearly)}
                  </span>
                  <small>{billing[tier.name] === "monthly" ? "per month" : "per year"}</small>
                </div>
                <p className="plan-highlight">
                  {tier.highlight} {billing[tier.name] === "yearly" && " · Yearly bonus applied"}
                </p>
              </div>
              <ul className="plan-perks">
                {tier.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <button className="btn primary-trace plan-cta">Select</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pricing;
