import React from "react";
import { FloatButton, Tooltip } from "antd";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { useAntdTheme } from "../theme/AntdThemeProvider";

export default function ThemeFloatButton() {
  const { theme, toggle } = useAntdTheme();
  const isDark = theme === "dark";

  // Use Tooltip wrapper for clarity on click action
  return (
    <Tooltip title={isDark ? "Светлая тема" : "Темная тема"} placement="left">
      <FloatButton
        onClick={toggle}
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        type="primary"
      />
    </Tooltip>
  );
}
