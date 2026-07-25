import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";
import DashboardPageClient from "./page.client";

export default async function DashboardPage() {
    const token = (await cookies()).get("token")?.value;

    if (!token) {
        redirect("/login");
    }

    const userData = await verifyToken(token);

    if (!userData) {
        (await cookies()).delete("token");
        redirect("/login");
    }

    const userName = userData.name; 

    return <DashboardPageClient userName={userName} />;
}