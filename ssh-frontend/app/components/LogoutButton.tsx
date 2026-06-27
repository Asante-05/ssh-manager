"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "../../lib/api";

export default function LogoutButton() {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!localStorage.getItem("access_token"));
  }, []);

  if (pathname === "/login" || !authed) return null;

  return (
    <button
      onClick={logout}
      className="text-xs text-zinc-500 hover:text-red-400 transition-colors font-medium"
    >
      Sign out
    </button>
  );
}