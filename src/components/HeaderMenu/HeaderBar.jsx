import React, { useEffect, useState } from "react";
import { Space, Button, Drawer } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import TopMenuButtons from "./TopMenuButtons";

export default function HeaderBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 700 : false
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Активна, если путь совпадает или начинается с location
  const isActive = (path) =>
    pathname === path || pathname.startsWith(`${path}/`);

  if (isMobile) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 20 }}>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setDrawerOpen(true)}
          style={{ fontSize: 20, marginLeft: 8 }}
        />
        <Drawer
          title="Меню"
          placement="left"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          bodyStyle={{ paddingTop: 8 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {TopMenuButtons.map(({ location, icon, title }) => (
              <Button
                key={location}
                type={isActive(location) ? "primary" : "default"}
                icon={icon}
                block
                onClick={() => {
                  navigate(location);
                  setDrawerOpen(false);
                }}
              >
                {title || ""}
              </Button>
            ))}
          </div>
        </Drawer>
      </div>
    );
  }

  return (
    <Space align="center" style={{ marginBottom: 20 }}>
      {TopMenuButtons.map(({ location, icon, title, shape, size }) => (
        <Button
          key={location}
          type={isActive(location) ? "primary" : "default"}
          shape={shape}
          size={size}
          icon={icon}
          onClick={() => navigate(location)}
        >
          {title}
        </Button>
      ))}
    </Space>
  );
}
