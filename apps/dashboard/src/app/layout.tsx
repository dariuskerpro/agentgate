import React from "react";

export const metadata = {
  title: "AgentGate Dashboard",
  description: "Seller analytics for your AgentGate endpoints",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "2rem" }}>
        <header style={{ marginBottom: "2rem" }}>
          <h1>🚪 AgentGate Dashboard</h1>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
