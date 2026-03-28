"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const logout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const linkClass = (path) =>
    `px-3 py-2 rounded ${
      pathname === path ? "bg-white text-black" : "text-white"
    }`;

  return (
    <div className="flex items-center gap-2 p-4 bg-black text-white">
      <h1 className="font-bold mr-4">GolfX</h1>

      <Link href="/dashboard" className={linkClass("/dashboard")}>
        Dashboard
      </Link>
      <Link href="/scores" className={linkClass("/scores")}>
        Scores
      </Link>
      <Link href="/charities" className={linkClass("/charities")}>
        Charities
      </Link>
      <Link href="/draws" className={linkClass("/draws")}>
        Draws
      </Link>
      <Link href="/subscription" className={linkClass("/subscription")}>
        Subscription
      </Link>
      <Link href="/winnings" className={linkClass("/winnings")}>
        Winnings
      </Link>

      <button
        onClick={logout}
        className="ml-auto bg-white text-black px-3 py-1 rounded"
      >
        Logout
      </button>
    </div>
  );
}