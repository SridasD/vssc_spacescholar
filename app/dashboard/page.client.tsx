"use client";

import Dashboard from "@/components/Dashboard";
import DashboardHeader from "@/components/DashboardHeader";
import FloatingButton from "@/components/FloatingButton";
import NavBar from "@/components/NavBar";

const DashboardPageClient = ({ userName }: { userName: string }) => {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <main className="py-10">
        <div className="px-5 mx-auto max-w-full sm:px-8 lg:px-12 lg:max-w-[110rem]">
          <DashboardHeader
            title="Analytics dashboard"
            subtitle="v1.0"
            userName={userName}
          />
          <Dashboard />
        </div>
      </main>

      <FloatingButton
        href="/upload"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        }
      />
    </div>
  );
};

export default DashboardPageClient;