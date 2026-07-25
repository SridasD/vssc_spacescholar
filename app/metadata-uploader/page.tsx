import NavBar from "@/components/NavBar";
import MetaDataUploader from "@/components/MetaDataUploader";

export default function DashboardBulkPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <main className="py-10">
        <div className="px-5 mx-auto max-w-full sm:px-8 lg:px-12 lg:max-w-7xl">
          {/* No Analytics header here */}

          {/* Bulk Upload Section — same shell as your dashboard cards */}
          <div className="grid grid-cols-1 gap-8 mt-8 lg:grid-cols-12">
            <div className="lg:col-span-12">
              <div className="p-6 bg-white rounded-lg shadow">
                <div className="space-y-4 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6 rounded-xl">
                  <div className="w-full max-w-8xl mx-auto backdrop-blur-lg bg-white/10 p-5 rounded-2xl border border-white/20 shadow-2xl">
                    <MetaDataUploader />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
