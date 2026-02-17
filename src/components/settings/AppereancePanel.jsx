import React from "react";
import { Card, Flex, Typography, Divider, theme as antdTheme } from "antd";
import {
  MoonOutlined,
  SunOutlined,
  LaptopOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useAntdTheme } from "../../theme/AntdThemeProvider";

const { Text, Title } = Typography;

export default function AppearancePanel() {
  const { mode: themeMode, theme: resolvedTheme, setThemeMode } = useAntdTheme();
  const { token } = antdTheme.useToken();

  const options = [
    { key: "system", label: "Системная", icon: <LaptopOutlined /> },
    { key: "dark", label: "Тёмная", icon: <MoonOutlined /> },
    { key: "light", label: "Светлая", icon: <SunOutlined /> },
  ];

  const isDark = resolvedTheme === "dark";

  const colors = {
    border: token.colorBorder || (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"),
    hover: token.colorFillSecondary || (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"),
    active: token.colorPrimaryBg || (isDark ? "rgba(48,117,255,0.18)" : "rgba(48,117,255,0.10)"),
  };

  return (
    <Card
      style={{
        background: "transparent",
        padding: 0,
        border: "none",
        boxShadow: "none",
      }}
      bodyStyle={{ padding: 0 }}
    >
      <Title level={5}>Тема оформления</Title>
      <Text type="secondary">
        Выберите стиль интерфейса — системный, тёмный или светлый
      </Text>
      <Divider />

      <Card
        style={{
          margin: "0 8px",
          overflow: "hidden",
          border: `1px solid ${colors.border}`,
          transition: "border-color 0.2s",
        }}
        bodyStyle={{ padding: 0 }}
      >
        {options.map((opt, index) => {
          const isActive = themeMode === opt.key;
          return (
            <div
              key={opt.key}
              onClick={() => setThemeMode(opt.key)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                cursor: "pointer",
                borderBottom:
                  index === options.length - 1
                    ? "none"
                    : `1px solid ${colors.border}`,
                background: isActive ? colors.active : "transparent",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = colors.hover;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <Flex align="center" gap={12}>
                <span style={{ fontSize: 20 }}>{opt.icon}</span>
                <Flex vertical>
                  <Text style={{ fontSize: 14 }}>{opt.label}</Text>
                </Flex>
              </Flex>
              {isActive && <CheckOutlined style={{ fontSize: 14 }} />}
            </div>
          );
        })}
      </Card>
    </Card>
  );
}
