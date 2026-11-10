import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "@/styles/globals.css";
import { AccessibilityInit } from "@/components/accessibility/AccessibilityInit";

export const metadata: Metadata = {
  title: "AccessAI — Universal Access & Opportunity Intelligence Platform",
  description:
    "A unified ecosystem for education, public services, career opportunities, and accessible information.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background text-foreground flex flex-col font-sans" suppressHydrationWarning>
        <ClerkProvider
          appearance={{
            theme: dark,
            variables: {
              colorBackground: "#000000",
              colorInput: "#000000",
              colorInputForeground: "#FFFFFF",
              colorPrimary: "#2563EB",
              colorForeground: "#FFFFFF",
              colorMutedForeground: "#B3B3B3",
              borderRadius: "0.75rem",
            },
            elements: {
              card: "bg-card border border-border shadow-2xl",
              navbar: "bg-card border-b border-border",
              headerTitle: "text-foreground font-bold",
              headerSubtitle: "text-muted",
              socialButtonsBlockButton: "bg-card border border-border text-foreground hover:bg-muted",
              formButtonPrimary: "bg-primary hover:bg-primary-hover text-white font-semibold",
              footerActionLink: "text-primary hover:underline",
            },
          }}
        >
          <AccessibilityInit />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
