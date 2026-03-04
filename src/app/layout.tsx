import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import Sidebar from "@/components/sidebar";
import LoginForm from "@/components/login-form";

export const metadata: Metadata = {
  title: "Lumis Admin",
  description: "Internal admin dashboard for Lumis",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get("admin_auth")?.value === "true";

  if (!isAuthed) {
    return (
      <html lang="en" className="dark">
        <body className="bg-zinc-950 text-zinc-100 antialiased">
          <LoginForm />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <Sidebar />
        <main className="ml-56 min-h-screen p-8">{children}</main>
      </body>
    </html>
  );
}
