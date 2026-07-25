"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut} from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Logout failed: ${response.status} ${response.statusText}`);
      }
      
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="px-3 py-1.5 text-sm font-medium rounded-full border border-saffron-deep/30 text-saffron-deep hover:bg-saffron-soft disabled:opacity-50 flex items-center gap-2 transition-colors"
    >
      <LogOut size={16} />
      {isLoggingOut ? "Logging out..." : "Logout"}
    </button>
  );
}