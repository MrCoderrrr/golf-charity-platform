import { motion } from "framer-motion";

// Animated serif wordmark with gold shimmer to match existing luxury theme.
const LegacyGreenLogo = () => {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 },
    },
  };

  const letter = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 220, damping: 18 },
    },
  };

  const letters = "LEGACY GREEN".split("");

  return (
    <motion.svg
      viewBox="0 0 320 64"
      className="logo-svg"
      variants={container}
      initial="hidden"
      animate="visible"
      aria-label="Legacy Green"
    >
      <defs>
        <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#af9533" />
          <stop offset="50%" stopColor="#fdf497" />
          <stop offset="100%" stopColor="#af9533" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="-1"
            to="1"
            dur="10s"
            repeatCount="indefinite"
          />
        </linearGradient>
        <filter id="inkBleed">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.35" />
        </filter>
      </defs>
      <motion.g
        filter="url(#inkBleed)"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 500,
          fontSize: "33px",
          letterSpacing: "0.12em",
        }}
      >
        {letters.map((char, idx) => (
          <motion.text
            key={`${char}-${idx}`}
            x={10 + idx * 20}
            y={40}
            fill="url(#logoGold)"
            stroke="#d4af37"
            strokeWidth="0.4"
            paintOrder="stroke"
            variants={letter}
          >
            {char}
          </motion.text>
        ))}
      </motion.g>
    </motion.svg>
  );
};

export default LegacyGreenLogo;
