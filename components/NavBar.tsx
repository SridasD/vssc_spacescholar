
"use client";

import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import Image from "next/image";
import vsscLogo from '@/public/images/vssc-logo.png';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, Upload, LayoutDashboard } from "lucide-react";

const NavBar: React.FC = () => {
    const router = useRouter();
    return (
      <nav className="bg-white shadow border-b border-border">
        <div
          className="h-[5px] w-full"
          style={{
            background:
              "linear-gradient(90deg, var(--saffron) 0 34%, #fff 34% 66%, var(--leaf) 66% 100%)",
          }}
          aria-hidden
        />
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => router.push("/")}
              >
                <Image
                  src={vsscLogo}
                  alt="VSSC Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />

                <span className="font-semibold text-lg bg-gradient-to-r logo-gradient bg-clip-text text-transparent">
                  SPACE SCHOLAR
                </span>
                <span className="text-gray-300 font-light mx-2">|</span>
                <Image
                  src="/images/vssc-orginal-logo.png"
                  alt="VSSC Original Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-full text-foreground/80 hover:text-primary hover:bg-primary/10"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <div className="relative group">
                {/* Dropdown logic */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 rounded-full text-foreground/80 hover:text-peacock-deep hover:bg-peacock-soft"
                    id="metadata-uploader-dropdown-btn"
                    type="button"
                    onClick={() => {
                      const dropdown = document.getElementById('metadata-uploader-dropdown');
                      if (dropdown) {
                        dropdown.classList.toggle('hidden');
                      }
                    }}
                  >
                    <Upload className="w-4 h-4" />
                    Metadata uploader
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </Button>

                  <div
                    id="metadata-uploader-dropdown"
                    className="absolute left-0 z-50 mt-2 w-72 origin-top-right rounded-xl border border-border bg-white shadow-lg hidden"
                  >
                    <div className="py-1">
                      <Link href="/metadata-splitter">
                        <span className="block px-4 py-2 text-sm text-foreground hover:bg-peacock-soft cursor-pointer">
                          Step 1: Upload CSV
                          <span className="block text-xs text-muted-foreground">
                            Large file? No worries—files with more than 1,000 rows
                            are auto-split for you.
                          </span>
                        </span>
                      </Link>

                      <Link href="/metadata-uploader">
                        <span className="block px-4 py-2 text-sm text-foreground hover:bg-peacock-soft cursor-pointer">
                          Step 2: Review & Submit
                          <span className="block text-xs text-muted-foreground">
                            After your file is successfully validated and contains
                            up to 1,000 rows (or has been split), you can review
                            and submit it for final processing
                          </span>
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => router.push("/upload")}
                className="flex items-center gap-2 rounded-full text-foreground/80 hover:text-saffron-deep hover:bg-saffron-soft"
              >
                <Upload className="w-4 h-4" />
                Upload Documents
              </Button>
            </div>
            <div className="flex items-center">
              <div className="flex items-center ml-4 md:ml-6">
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
};

export default NavBar;