import type { Metadata } from "next";
import { Baloo_2, Mulish } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "devanagari"],
});

const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DHARA — Dynamic Health & Risk Analytics for Rural Micro Enterprises",
  description:
    "Offline-first, voice-first cash-flow intelligence for SHGs, FPOs and rural entrepreneurs. Enterprise Pulse · 3–6 month forecasts · explainable risk flags · insights in your language. NABARD Hackathon · Team Kellton.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${baloo.variable} ${mulish.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
