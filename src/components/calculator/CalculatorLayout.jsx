import React from "react";

export function CalculatorPageLayout({ children }) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {children}
    </div>
  );
}

export function CalculatorCenteredBlock({ children, maxWidth = 630 }) {
  return (
    <div style={{ width: "100%", maxWidth, margin: "0 auto" }}>
      {children}
    </div>
  );
}
