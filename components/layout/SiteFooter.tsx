import Image from "next/image";
import Link from "next/link";
import vsscLogo from "@/public/images/vssc-logo.png";

// Set once the real "Ask a Librarian" destination is shared — when present,
// the link opens externally in a new tab instead of the internal page.
const ASK_LIBRARIAN_URL = process.env.NEXT_PUBLIC_ASK_LIBRARIAN_URL || "";

export function SiteFooter() {
  return (
    <footer className="w-full flex-shrink-0 bg-white border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Left: brand */}
          <div className="flex items-center gap-3">
            <Image
              src={vsscLogo}
              alt="VSSC"
              width={44}
              height={44}
              className="object-contain"
            />
            <div className="flex flex-col leading-tight text-left">
              <span className="font-semibold text-sm text-foreground">SPACE SCHOLAR</span>
              <span className="text-xs text-muted-foreground">Library Knowledge Repository</span>
            </div>
          </div>

          {/* Centre: copyright + quick links */}
          <div className="text-center">
            <p className="text-sm font-bold text-foreground tracking-tight">
              SPACE SCHOLAR &copy; 2026
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              An initiative by Library &amp; Information Resource Division, VSSC
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="italic font-medium text-saffron-deep">&quot;A Partnership in Innovation&quot;</span>
              <span className="mx-1.5">·</span>
              Vikram Sarabhai Space Centre &amp; Digital University Kerala
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
              <a
                href="https://gyaanpath.vssc.dos.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-saffron-deep"
              >
                Library
              </a>
              <a
                href={process.env.NEXT_PUBLIC_OPAC_URL || "http://10.41.7.248/"}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-saffron-deep"
              >
                OPAC
              </a>
              {ASK_LIBRARIAN_URL ? (
                <a
                  href={ASK_LIBRARIAN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-saffron-deep"
                >
                  Ask a Librarian
                </a>
              ) : (
                <Link href="/ask-librarian" className="hover:text-saffron-deep">
                  Ask a Librarian
                </Link>
              )}
              <Link href="/help" className="hover:text-saffron-deep">
                Help
              </Link>
            </div>
          </div>

          {/* Right: DUK partner logo */}
          <div className="flex flex-col items-center sm:items-end gap-1">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              A partnership in innovation
            </span>
            <Image
              src="/images/duk-logo.png"
              alt="Digital University Kerala"
              width={140}
              height={50}
              className="object-contain h-10 w-auto"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;
