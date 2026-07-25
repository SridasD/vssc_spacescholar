import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
    const cookiesData = await cookies();
    const token = cookiesData.get("token")?.value;

    if (token) {
        const userData = await verifyToken(token);

        if (userData) {
            redirect("/dashboard");
        }
    }

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden">
            {/* Starfield background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(30,41,59,0.6)_0%,_rgba(2,6,23,1)_70%)]" />

            {/* Decorative gradient orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div
                className="absolute inset-0 opacity-60 pointer-events-none"
                style={{
                    backgroundImage: `
                        radial-gradient(1px 1px at 20% 30%, white, transparent),
                        radial-gradient(1px 1px at 60% 70%, white, transparent),
                        radial-gradient(1px 1px at 80% 20%, white, transparent),
                        radial-gradient(1px 1px at 30% 80%, white, transparent),
                        radial-gradient(1px 1px at 90% 50%, white, transparent),
                        radial-gradient(1px 1px at 10% 60%, white, transparent),
                        radial-gradient(1.5px 1.5px at 50% 40%, rgba(147,197,253,0.8), transparent),
                        radial-gradient(1.5px 1.5px at 70% 90%, rgba(196,181,253,0.8), transparent)
                    `,
                    backgroundSize: '300px 300px, 250px 250px, 200px 200px, 350px 350px, 280px 280px, 320px 320px, 400px 400px, 380px 380px',
                }}
            />

            {/* Login form */}
            <div className="relative z-10 px-4 py-16">
                <LoginForm />
            </div>
        </div>
    );
}