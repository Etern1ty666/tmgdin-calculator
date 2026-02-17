import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "antd/dist/reset.css"; // новый стиль antd v5
import AntdThemeProvider from "./theme/AntdThemeProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AntdThemeProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AntdThemeProvider>
);
