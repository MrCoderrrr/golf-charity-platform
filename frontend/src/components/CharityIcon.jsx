import React from "react";

const Base = ({ size = 28, title, children, className = "" }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={title || "icon"}
  >
    <g
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </g>
  </svg>
);

// Simple, consistent icon set (no letters/numbers). Store `icon` as the key string in DB.
const Icons = {
  star: (p) => (
    <Base {...p} title="Star">
      <path d="M12 2.6l2.9 6 6.6.9-4.8 4.7 1.2 6.6L12 18.8 6.1 20.8l1.2-6.6L2.5 9.5l6.6-.9L12 2.6z" />
    </Base>
  ),
  star4: (p) => (
    <Base {...p} title="Star 4">
      <path d="M12 2.5l1.8 6.2L20 12l-6.2 1.8L12 20.1l-1.8-6.3L3.9 12l6.3-3.3L12 2.5z" />
    </Base>
  ),
  starCircle: (p) => (
    <Base {...p} title="Star in circle">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.1l1.7 3.5 3.9.6-2.8 2.7.7 3.9L12 15.2 8.5 16.8l.7-3.9-2.8-2.7 3.9-.6L12 6.1z" />
    </Base>
  ),
  sparkle: (p) => (
    <Base {...p} title="Sparkle">
      <path d="M12 2.8l1.1 4.1L17.2 8l-4.1 1.1L12 13.2l-1.1-4.1L6.8 8l4.1-1.1L12 2.8z" />
      <path d="M19 12.2l.6 2.1 2.1.6-2.1.6-.6 2.1-.6-2.1-2.1-.6 2.1-.6.6-2.1z" />
      <path d="M4.9 13.4l.5 1.7 1.7.5-1.7.5-.5 1.7-.5-1.7-1.7-.5 1.7-.5.5-1.7z" />
    </Base>
  ),
  crown: (p) => (
    <Base {...p} title="Crown">
      <path d="M4.5 9.5l4.2 3.1L12 7.4l3.3 5.2 4.2-3.1V18a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V9.5z" />
      <path d="M6.7 18h10.6" />
    </Base>
  ),
  trophy: (p) => (
    <Base {...p} title="Trophy">
      <path d="M8 4h8v3a4 4 0 0 1-8 0V4z" />
      <path d="M10 15h4" />
      <path d="M9 20h6" />
      <path d="M12 11v4" />
      <path d="M6 5H4.8A1.8 1.8 0 0 0 3 6.8V8a4 4 0 0 0 4 4" />
      <path d="M18 5h1.2A1.8 1.8 0 0 1 21 6.8V8a4 4 0 0 1-4 4" />
    </Base>
  ),
  medal: (p) => (
    <Base {...p} title="Medal">
      <circle cx="12" cy="14" r="4.5" />
      <path d="M8.2 2.8H12l1 4.8-1.8 1.2L8.2 2.8z" />
      <path d="M15.8 2.8H12l-1 4.8 1.8 1.2 3-6z" />
    </Base>
  ),
  laurel: (p) => (
    <Base {...p} title="Laurel">
      <path d="M8.5 20c-2.8-2-4.6-5.2-4.6-8.8C3.9 7.1 6.5 4.1 10 3" />
      <path d="M15.5 20c2.8-2 4.6-5.2 4.6-8.8 0-4.1-2.6-7.1-6.1-8.2" />
      <path d="M7.3 12.2l2.7-.8-1.3 2.5" />
      <path d="M16.7 12.2l-2.7-.8 1.3 2.5" />
      <path d="M6.8 8.7l2.6.2-2 1.9" />
      <path d="M17.2 8.7l-2.6.2 2 1.9" />
    </Base>
  ),
  shield: (p) => (
    <Base {...p} title="Shield">
      <path d="M12 2.8l7 3v6.2c0 5-3.5 8.5-7 9.9-3.5-1.4-7-4.9-7-9.9V5.8l7-3z" />
    </Base>
  ),
  shieldCheck: (p) => (
    <Base {...p} title="Shield check">
      <path d="M12 2.8l7 3v6.2c0 5-3.5 8.5-7 9.9-3.5-1.4-7-4.9-7-9.9V5.8l7-3z" />
      <path d="M8.7 12.1l2.2 2.2 4.6-4.6" />
    </Base>
  ),
  heart: (p) => (
    <Base {...p} title="Heart">
      <path d="M12 20.6s-7-4.4-9.1-8.6C1.2 8.4 3.4 5.6 6.3 5.6c1.6 0 3.1.8 3.9 2.1.8-1.3 2.3-2.1 3.9-2.1 2.9 0 5.1 2.8 3.4 6.4-2.1 4.2-9.1 8.6-9.1 8.6z" />
    </Base>
  ),
  handshake: (p) => (
    <Base {...p} title="Handshake">
      <path d="M7.5 12.1l2.3 2.3a2.2 2.2 0 0 0 3.1 0l2.8-2.8" />
      <path d="M3.6 10.4l3-3c1.2-1.2 3.1-1.3 4.4-.2l1 1" />
      <path d="M20.4 10.4l-3-3c-1.2-1.2-3.1-1.3-4.4-.2l-1 1" />
      <path d="M2.8 11.2l2.2 2.2" />
      <path d="M21.2 11.2L19 13.4" />
    </Base>
  ),
  people: (p) => (
    <Base {...p} title="People">
      <path d="M16.5 21v-1.4a3.6 3.6 0 0 0-3.6-3.6H8.1a3.6 3.6 0 0 0-3.6 3.6V21" />
      <circle cx="10.5" cy="8.5" r="3.2" />
      <path d="M18.2 21v-1.1a3.3 3.3 0 0 0-2.4-3.2" />
      <path d="M16.3 5.6a3 3 0 0 1 0 5.8" />
    </Base>
  ),
  target: (p) => (
    <Base {...p} title="Target">
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5.2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 12l5.5-5.5" />
    </Base>
  ),
  bolt: (p) => (
    <Base {...p} title="Bolt">
      <path d="M13 2.8L5.6 13.2h6l-1 8 7.8-10.4h-6l.6-8z" />
    </Base>
  ),
  flame: (p) => (
    <Base {...p} title="Flame">
      <path d="M12 21c-3.7 0-6.6-2.7-6.6-6.3 0-2.8 1.8-4.7 3.4-6.2 1.2-1.2 2.1-2.2 2.5-3.7 1.1 1.4 2.3 2.7 3.4 3.9 1.8 1.9 3.5 3.8 3.5 6 0 3.6-2.9 6.3-6.6 6.3z" />
      <path d="M12 21c-1.9 0-3.4-1.4-3.4-3.2 0-1.3.8-2.2 1.6-3.1.7-.7 1.3-1.4 1.8-2.4 1 .9 2 2.1 2 3.6 0 1.8-1.5 3.1-3.4 3.1z" />
    </Base>
  ),
  globe: (p) => (
    <Base {...p} title="Globe">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 12h17" />
      <path d="M12 3c2.6 2.7 4.2 6.2 4.2 9s-1.6 6.3-4.2 9c-2.6-2.7-4.2-6.2-4.2-9S9.4 5.7 12 3z" />
    </Base>
  ),
  leaf: (p) => (
    <Base {...p} title="Leaf">
      <path d="M20.2 3.8C11 3.8 6 8.6 4.2 12.6c-1.7 3.8.4 7.6 4.6 7.6 7.7 0 11.4-7.1 11.4-16.4z" />
      <path d="M4.8 18.8c2.6-2.6 6.6-5.2 11.4-6.6" />
    </Base>
  ),
  calendar: (p) => (
    <Base {...p} title="Calendar">
      <rect x="4" y="5.5" width="16" height="15" rx="2.2" />
      <path d="M7.5 3.5v4" />
      <path d="M16.5 3.5v4" />
      <path d="M4 9.5h16" />
      <path d="M8 13h3" />
      <path d="M13 13h3" />
      <path d="M8 16.5h3" />
      <path d="M13 16.5h3" />
    </Base>
  ),
  clock: (p) => (
    <Base {...p} title="Clock">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.4v5l3.4 2" />
    </Base>
  ),
  checkeredFlag: (p) => (
    <Base {...p} title="Checkered flag">
      <path d="M6 21V4.5" />
      <path d="M6 5.2c2.3-1.3 4.6-1.3 6.9 0 2.2 1.3 4.4 1.3 6.6 0v9.2c-2.2 1.3-4.4 1.3-6.6 0-2.3-1.3-4.6-1.3-6.9 0V5.2z" />
      <path d="M10 6.6v8.8" />
      <path d="M14 5.9v8.8" />
    </Base>
  ),
  cardsSingle: (p) => (
    <Base {...p} title="Card">
      <rect x="6" y="4.5" width="12" height="15" rx="2.2" />
      <path d="M9 8.2h6" />
      <path d="M9 11.7h6" />
      <path d="M9 15.2h4" />
    </Base>
  ),
  cardsStack: (p) => (
    <Base {...p} title="Cards">
      <rect x="7" y="5.5" width="12" height="14" rx="2.2" />
      <path d="M5 8.2V6.8A2.3 2.3 0 0 1 7.3 4.5H16" />
      <path d="M9.2 9h7.0" />
      <path d="M9.2 12.4h7.0" />
    </Base>
  ),
  suitSpade: (p) => (
    <Base {...p} title="Spade">
      <path d="M12 3.3c3.3 3 6.5 5.4 6.5 9 0 2.4-1.9 4.2-4.4 4.2-1 0-2-.3-2.8-.9.2 1.8.9 3.3 2 4.9H10c1.1-1.6 1.8-3.1 2-4.9-.8.6-1.8.9-2.8.9-2.5 0-4.4-1.8-4.4-4.2 0-3.6 3.2-6 6.5-9z" />
    </Base>
  ),
  suitHeart: (p) => (
    <Base {...p} title="Heart suit">
      <path d="M12 20.2s-6.5-4.1-8.4-7.9c-1.6-3.3.5-5.8 3.2-5.8 1.6 0 3 .8 3.8 2.1.8-1.3 2.2-2.1 3.8-2.1 2.7 0 4.8 2.5 3.2 5.8-1.9 3.8-8.4 7.9-8.4 7.9z" />
    </Base>
  ),
  suitDiamond: (p) => (
    <Base {...p} title="Diamond suit">
      <path d="M12 3.3l6.8 8.7L12 20.7 5.2 12 12 3.3z" />
    </Base>
  ),
  suitClub: (p) => (
    <Base {...p} title="Club suit">
      <circle cx="9" cy="10" r="3" />
      <circle cx="15" cy="10" r="3" />
      <circle cx="12" cy="14.4" r="3" />
      <path d="M12 17c.2 1.5.8 2.6 1.8 3.9H10.2c1-1.3 1.6-2.4 1.8-3.9" />
    </Base>
  ),
  chessPawn: (p) => (
    <Base {...p} title="Chess pawn">
      <path d="M9 21h6" />
      <path d="M9.3 18.5h5.4" />
      <path d="M10.2 18.5c.2-2.3 1.4-3.5 1.8-4.2.4-.6-.8-1.5-.8-3A1.8 1.8 0 0 1 13 9.5c0-1.6-1.1-2.4-1.1-3.5A2.1 2.1 0 0 1 14 4a2.1 2.1 0 0 1 2.1 2c0 1.1-1.1 1.9-1.1 3.5a1.8 1.8 0 0 1 1.8 1.8c0 1.5-1.2 2.4-.8 3 .4.7 1.6 1.9 1.8 4.2" />
    </Base>
  ),
  chessKnight: (p) => (
    <Base {...p} title="Chess knight">
      <path d="M8 20h10" />
      <path d="M9.2 20c0-2.6.7-4.2 1.7-5.8 1-1.6.6-3.7-.8-5.1l2-2.2c1.1 1 2.5 1.4 4 1.2l-1.8 2.6 2.2 1.6c-1.5 2.6-4.2 3.4-5.3 4.5-.8.8-1.2 1.9-1.2 3.2" />
      <path d="M12.4 9.1l-1.7-2.2" />
    </Base>
  ),
  chessRook: (p) => (
    <Base {...p} title="Chess rook">
      <path d="M8 21h8" />
      <path d="M9 18h6" />
      <path d="M9.5 18V9.5h5V18" />
      <path d="M8.8 9.5V6h1.6v2h1.4V6h1.6v2h1.4V6h1.6v3.5" />
    </Base>
  ),
  chessBishop: (p) => (
    <Base {...p} title="Chess bishop">
      <path d="M9 21h6" />
      <path d="M9.4 18.6h5.2" />
      <path d="M10.2 18.6c.2-2.4 1.4-3.6 1.8-4.3.6-1-1.2-1.7-1.2-3.4 0-1.3.9-2.3 2.2-2.3s2.2 1 2.2 2.3c0 1.7-1.8 2.4-1.2 3.4.4.7 1.6 1.9 1.8 4.3" />
      <path d="M12 3.6c1.3 1 2.2 2.2 2.2 3.8 0 1.1-.6 1.9-2.2 3-1.6-1.1-2.2-1.9-2.2-3 0-1.6.9-2.8 2.2-3.8z" />
      <path d="M11.2 6.8h1.6" />
    </Base>
  ),
  chessQueen: (p) => (
    <Base {...p} title="Chess queen">
      <path d="M8.5 21h7" />
      <path d="M9 18h6" />
      <path d="M9.5 18l-1-8 3 2 1.5-6 1.5 6 3-2-1 8" />
      <path d="M10 6.3l-.7-1" />
      <path d="M14 6.3l.7-1" />
    </Base>
  ),
  chessKing: (p) => (
    <Base {...p} title="Chess king">
      <path d="M9 21h6" />
      <path d="M9.4 18.6h5.2" />
      <path d="M10.2 18.6c.2-3.1 1.1-4.1 1.8-5 .7-.9-1-1.9-1-3.2A2.9 2.9 0 0 1 12 7.5a2.9 2.9 0 0 1 2 2.9c0 1.3-1.7 2.3-1 3.2.7.9 1.6 1.9 1.8 5" />
      <path d="M12 3.2v3.4" />
      <path d="M10.4 4.9h3.2" />
    </Base>
  ),
  gem: (p) => (
    <Base {...p} title="Gem">
      <path d="M7.2 6.8L12 3.5l4.8 3.3 2.2 4.2L12 20.7 5 11l2.2-4.2z" />
      <path d="M7.2 6.8h9.6" />
      <path d="M5 11h14" />
      <path d="M10 11l2 9.7" />
      <path d="M14 11l-2 9.7" />
    </Base>
  ),
  ribbon: (p) => (
    <Base {...p} title="Ribbon">
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M10.2 12.2L8.5 20l3.5-2 3.5 2-1.7-7.8" />
    </Base>
  ),
  gift: (p) => (
    <Base {...p} title="Gift">
      <rect x="4.5" y="10" width="15" height="11" rx="2" />
      <path d="M12 10v11" />
      <path d="M4.5 13.2h15" />
      <path d="M12 10H7.8c-1.6 0-2.8-1-2.8-2.2 0-1.5 1.6-2.5 3.1-1.9 1.6.6 2.5 2.5 3.9 4.1z" />
      <path d="M12 10h4.2c1.6 0 2.8-1 2.8-2.2 0-1.5-1.6-2.5-3.1-1.9-1.6.6-2.5 2.5-3.9 4.1z" />
    </Base>
  ),
  coin: (p) => (
    <Base {...p} title="Coin">
      <ellipse cx="12" cy="8" rx="7.5" ry="3.2" />
      <path d="M4.5 8v8.2c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2V8" />
      <path d="M7.4 12.2c1.4.6 3.1.9 4.6.9 1.6 0 3.2-.3 4.6-.9" />
    </Base>
  ),
  banknote: (p) => (
    <Base {...p} title="Banknote">
      <rect x="4.5" y="7" width="15" height="10" rx="2" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M6.8 9.2c0 1.2-1 2.2-2.3 2.2" />
      <path d="M19.5 11.4c-1.2 0-2.2-1-2.2-2.2" />
      <path d="M6.8 14.8c0-1.2-1-2.2-2.3-2.2" />
      <path d="M19.5 12.6c-1.2 0-2.2 1-2.2 2.2" />
    </Base>
  ),
  pie: (p) => (
    <Base {...p} title="Pie chart">
      <path d="M12 3v9h9" />
      <path d="M20.7 13a9 9 0 1 1-8.7-10" />
    </Base>
  ),
  chartUp: (p) => (
    <Base {...p} title="Chart up">
      <path d="M5 19V5" />
      <path d="M5 19h14" />
      <path d="M7.5 14.5l3-3 2.5 2.5 5-5" />
      <path d="M16 9h2v2" />
    </Base>
  ),
  document: (p) => (
    <Base {...p} title="Document">
      <path d="M8 3.8h6l3 3V20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2z" />
      <path d="M14 3.8V7h3" />
      <path d="M8.8 11h6.4" />
      <path d="M8.8 14.4h6.4" />
      <path d="M8.8 17.8h4.2" />
    </Base>
  ),
  camera: (p) => (
    <Base {...p} title="Camera">
      <path d="M6.2 7.6h2l1-1.8h5.6l1 1.8h2A2.2 2.2 0 0 1 20 9.8v8A2.2 2.2 0 0 1 17.8 20H6.2A2.2 2.2 0 0 1 4 17.8v-8A2.2 2.2 0 0 1 6.2 7.6z" />
      <circle cx="12" cy="14" r="3.2" />
    </Base>
  ),
  bell: (p) => (
    <Base {...p} title="Bell">
      <path d="M12 21a2.2 2.2 0 0 0 2.2-2.2H9.8A2.2 2.2 0 0 0 12 21z" />
      <path d="M18 16.8H6c1.2-1.2 1.7-2.2 1.7-4.1v-2.2a4.3 4.3 0 0 1 8.6 0v2.2c0 1.9.5 2.9 1.7 4.1z" />
      <path d="M10.2 6.3a2 2 0 0 1 3.6 0" />
    </Base>
  ),
  mapPin: (p) => (
    <Base {...p} title="Map pin">
      <path d="M12 21s6.3-5.2 6.3-11A6.3 6.3 0 0 0 12 3.7 6.3 6.3 0 0 0 5.7 10c0 5.8 6.3 11 6.3 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </Base>
  ),
  puzzle: (p) => (
    <Base {...p} title="Puzzle">
      <path d="M9 4h3a2 2 0 1 1 4 0h3v5a2 2 0 1 0 0 4v5h-5a2 2 0 1 1-4 0H5v-5a2 2 0 1 0 0-4V4h4z" />
    </Base>
  ),
  sun: (p) => (
    <Base {...p} title="Sun">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v2.2" />
      <path d="M12 18.8V21" />
      <path d="M3 12h2.2" />
      <path d="M18.8 12H21" />
      <path d="M5.1 5.1l1.6 1.6" />
      <path d="M17.3 17.3l1.6 1.6" />
      <path d="M18.9 5.1l-1.6 1.6" />
      <path d="M6.7 17.3l-1.6 1.6" />
    </Base>
  ),
  moon: (p) => (
    <Base {...p} title="Moon">
      <path d="M21 14.5A7.8 7.8 0 0 1 9.5 3a6.7 6.7 0 1 0 11.5 11.5z" />
    </Base>
  ),
  rocket: (p) => (
    <Base {...p} title="Rocket">
      <path d="M14.5 4.2c2.7.4 4.4 2.1 5.3 5.3-2.3 5.6-7.6 8.5-12 10.1L5.5 18c1.6-4.4 4.5-9.7 10.1-12z" />
      <path d="M9.5 14.5l-3.7 3.7-1-4.7 4.7 1z" />
      <circle cx="15.3" cy="8.7" r="1.4" />
    </Base>
  ),
  dice: (p) => (
    <Base {...p} title="Dice">
      <rect x="6" y="6" width="12" height="12" rx="2.2" />
      <circle cx="9.2" cy="9.2" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="14.8" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="9.2" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="9.2" cy="14.8" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </Base>
  ),
  compass: (p) => (
    <Base {...p} title="Compass">
      <circle cx="12" cy="12" r="9" />
      <path d="M14.6 9.4l-2.1 5.2-5.1 2.1 2.1-5.2 5.1-2.1z" />
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
    </Base>
  ),
};

export const CHARITY_ICON_CHOICES = [
  "star",
  "star4",
  "starCircle",
  "sparkle",
  "crown",
  "trophy",
  "medal",
  "laurel",
  "shield",
  "shieldCheck",
  "heart",
  "handshake",
  "people",
  "target",
  "bolt",
  "flame",
  "globe",
  "leaf",
  "calendar",
  "clock",
  "checkeredFlag",
  "cardsSingle",
  "cardsStack",
  "suitSpade",
  "suitHeart",
  "suitDiamond",
  "suitClub",
  "chessPawn",
  "chessKnight",
  "chessRook",
  "chessBishop",
  "chessQueen",
  "chessKing",
  "gem",
  "ribbon",
  "gift",
  "coin",
  "banknote",
  "pie",
  "chartUp",
  "document",
  "camera",
  "bell",
  "mapPin",
  "puzzle",
  "sun",
  "moon",
  "rocket",
  "dice",
  "compass",
].slice(0, 50);

export const normalizeCharityIconKey = (iconKey) => {
  const key = String(iconKey || "").trim();
  return Object.prototype.hasOwnProperty.call(Icons, key) ? key : "star";
};

export const CharityIcon = ({ iconKey, size = 28, className = "" }) => {
  const key = normalizeCharityIconKey(iconKey);
  const Comp = Icons[key] || Icons.star;
  return <Comp size={size} className={className} />;
};
