import React from "react";

export const metadata = {
  title: "AgentGate — Monetize Your API for the Agent Economy",
  description:
    "Turn any API into a paid endpoint for AI agents. 5-minute setup, USDC payments, instant settlement on Base.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
