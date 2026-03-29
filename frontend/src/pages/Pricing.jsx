import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

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

const STRIPE_PAYMENT_LINKS = {
  basic: {
    monthly: "https://buy.stripe.com/test_7sYeVc6cq0Fy78acFn4Ni01",
    yearly: "https://buy.stripe.com/test_28E4gybwKag88ce9tb4Ni02",
  },
  pro: {
    monthly: "https://buy.stripe.com/test_7sY28q58m0Fy646eNv4Ni03",
    yearly: "https://buy.stripe.com/test_6oUcN4gR43RKeAC9tb4Ni04",
  },
  elite: {
    monthly: "https://buy.stripe.com/test_dRm14mcAO8808ce7l34Ni05",
    yearly: "https://buy.stripe.com/test_7sY00i0S64VO8cebBj4Ni06",
  },
};

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState("");
  const [loadingKey, setLoadingKey] = useState("");
  const [billing, setBilling] = useState({
    Basic: "monthly",
    Pro: "monthly",
    Elite: "monthly",
  });

  const formatINR = (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number(n || 0));

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
          const tierKey = String(tier.name || "").toLowerCase();
          const planType = billing[tier.name] === "yearly" ? "yearly" : "monthly";
          const buttonKey = `${tierKey}:${planType}`;
          const isRedirecting = loadingKey === buttonKey;
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
          const ctaClass = isBasic
            ? "plan-cta plan-cta--basic"
            : isPro
            ? "plan-cta plan-cta--pro"
            : "plan-cta plan-cta--elite";

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
              <button
                className={`btn primary-trace ${ctaClass}`}
                disabled={isRedirecting}
                onClick={async () => {
                  setStatus("");
                  if (!user) {
                    navigate("/login");
                    return;
                  }
                  const url = STRIPE_PAYMENT_LINKS?.[tierKey]?.[planType] || "";
                  if (!url) {
                    setStatus("Missing payment link for this plan.");
                    return;
                  }

                  setLoadingKey(`${tierKey}:${planType}`);
                  try {
                    await api.post("/subscriptions", { planType, tier: tierKey });
                    window.location.href = url;
                  } catch (err) {
                    setStatus(err?.response?.data?.message || "Subscription failed.");
                  } finally {
                    setLoadingKey("");
                  }
                }}
              >
                {isRedirecting ? "Redirecting..." : "Select"}
              </button>
            </div>
          );
        })}
      </div>

      {status && (
        <div className="card glass-card" style={{ marginTop: 14, padding: 14 }}>
          <div className="badge">{status}</div>
        </div>
      )}
    </div>
  );
};

export default Pricing;
