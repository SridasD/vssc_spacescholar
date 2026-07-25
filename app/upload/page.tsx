"use client";
import DocumentUploadForm from "@/components/DocumentUploadForm";
import NavBar from "@/components/NavBar";
import DashboardHeader from "@/components/DashboardHeader";
import useAuth from "@/hooks/useAuth";

const UploadPage = () => {
  const userName = useAuth();
  if (!userName) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      <main className="py-10">
        <div className="px-5 mx-auto max-w-full sm:px-8 lg:px-12 lg:max-w-[110rem]">
          <DashboardHeader
            title="Upload Documents"
            subtitle="v1.0"
            userName={userName}
          />

          {/* Form is constrained to a comfortable reading width and centered */}
          <div className="mt-8 mx-auto max-w-5xl">
            <DocumentUploadForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default UploadPage;