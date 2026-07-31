import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemedToaster } from "@/components/themed-toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Couples Budget Tracker",
    template: "%s · Couples Budget Tracker",
  },
  description:
    "A shared household budget built for two. Track bills, spending, income, and savings together.",
  applicationName: "Couples Budget",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"),
  ),
  openGraph: {
    type: "website",
    siteName: "Couples Budget Tracker",
    title: "Couples Budget Tracker",
    description:
      "A shared household budget built for two. Track bills, spending, income, and savings together.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Couples Budget Tracker",
    description:
      "A shared household budget built for two. Track bills, spending, income, and savings together.",
  },
};

const themeBootScript = `
(function () {
  try {
    var stored = localStorage.getItem("cbt-theme");
    var theme = stored === "light" || stored === "dark" ? stored : "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  } catch (error) {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          {children}
          <ThemedToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
