import React from "react";
import type { Metadata } from "next";
import { Navbar } from "../components/navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentGate — The Infrastructure Layer for the Agent Economy",
  description:
    "Where AI agents find, call, and pay each other. Discovery, routing, identity, and USDC settlement — three lines of code, no signup required.",
  metadataBase: new URL("https://agentgate.online"),
  openGraph: {
    title: "AgentGate — The Infrastructure Layer for the Agent Economy",
    description:
      "Where AI agents find, call, and pay each other. Discovery, routing, identity, and USDC settlement — three lines of code, no signup required.",
    url: "https://agentgate.online",
    siteName: "AgentGate",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AgentGate — The Infrastructure Layer for the Agent Economy",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentGate — The Infrastructure Layer for the Agent Economy",
    description:
      "Where AI agents find, call, and pay each other. Discovery, routing, identity, and USDC settlement — no signup required.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
