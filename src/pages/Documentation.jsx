import React from "react";
import { Outlet } from "react-router-dom";
import DocumentationNav from "../components/documentation/docsNavigation.jsx/DocumentationNav";

export default function Documentation() {
  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 16px" }}>
  <DocumentationNav />
  <div style={{ textAlign: "left" }}>
    <Outlet />
  </div>
</div>
  );
}
