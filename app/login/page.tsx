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
        <div className="relative flex items-center justify-center min-h-screen bg-background overflow-hidden">
            {/* Tricolour top strip */}
            <div
                className="absolute top-0 left-0 h-[5px] w-full"
                style={{
                    background:
                        "linear-gradient(90deg, var(--saffron) 0 34%, #fff 34% 66%, var(--leaf) 66% 100%)",
                }}
                aria-hidden
            />

            {/* Soft tricolour blob decoration */}
            <div
                className="absolute inset-0 pointer-events-none"
                aria-hidden
                style={{
                    background:
                        "radial-gradient(circle at 12% 18%, rgba(244,122,31,0.14), transparent 27%), radial-gradient(circle at 88% 20%, rgba(7,158,210,0.14), transparent 28%), radial-gradient(circle at 80% 86%, rgba(22,139,114,0.12), transparent 24%)",
                }}
            />

            {/* Login form */}
            <div className="relative z-10 px-4 py-16">
                <LoginForm />
            </div>
        </div>
    );
}