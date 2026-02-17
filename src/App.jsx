import HeaderBar from "./components/HeaderMenu/HeaderBar";
import AppRoutes from "./routes/AppRoutes";
import { theme as antdTheme } from "antd";
import ThemeFloatButton from "./components/ThemeFloatButton";

export default function App() {
  const { token } = antdTheme.useToken();
  return (
    <div
      style={{
        textAlign: "center",
        paddingTop: 10,
        background: token.colorBgBase,
        color: token.colorText,
        minHeight: "100vh",
      }}
    >
      <HeaderBar />
      <AppRoutes />
    </div>
  );
}
