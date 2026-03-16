import React from "react";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentGate — The Infrastructure Layer for the Agent Economy",
  description:
    "Routing, identity, discovery, and payment for AI agents. The Stripe of the agent economy. Deploy and monetize agents in minutes.",
  metadataBase: new URL("https://text2ai.com"),
  openGraph: {
    title: "AgentGate — The Infrastructure Layer for the Agent Economy",
    description:
      "Routing, identity, discovery, and payment for AI agents. The Stripe of the agent economy. Deploy and monetize agents in minutes.",
    url: "https://text2ai.com",
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
      "Routing, identity, discovery, and payment for AI agents. The Stripe of the agent economy.",
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
      <body>{children}</body>
    </html>
  );
}
