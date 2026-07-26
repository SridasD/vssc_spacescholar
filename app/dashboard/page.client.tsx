"use client";

import Dashboard from "@/components/Dashboard";
import DashboardHeader from "@/components/DashboardHeader";
import FloatingButton from "@/components/FloatingButton";
import NavBar from "@/components/NavBar";

const DashboardPageClient = ({ userName }: { userName: string }) => {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <div
        className="relative overflow-hidden px-5 py-6 sm:px-8 lg:px-12"
        style={{
          background:
            "radial-gradient(circle at 90% 0%, rgba(245,196,78,0.22), transparent 26%), linear-gradient(135deg, var(--peacock-deep), hsl(var(--primary)) 58%, var(--peacock))",
        }}
      >
        <div className="mx-auto max-w-full lg:max-w-[110rem]">
          <DashboardHeader
            title="Analytics dashboard"
            subtitle="Document processing pipeline overview"
            userName={userName}
          />
        </div>
      </div>

      <main className="py-10">
        <div className="px-5 mx-auto max-w-full sm:px-8 lg:px-12 lg:max-w-[110rem]">
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