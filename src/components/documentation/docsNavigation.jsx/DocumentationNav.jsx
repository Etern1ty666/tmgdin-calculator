import { Space, Button, Input, Flex } from "antd";
import React, { useMemo, useState } from "react";

import { useNavigate, useLocation } from "react-router-dom";
import DocsNavigationButtons from "./DocsNavigationButtons";
const { Search } = Input;

export default function DocumentationNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path) => pathname === path;

  const [query, setQuery] = useState("");
  const filteredButtons = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return DocsNavigationButtons;
    return DocsNavigationButtons.filter((b) =>
      (b.title || "").toLowerCase().includes(q) || (b.location || "").toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <>
<Search
      placeholder="Поиск по документации"
      allowClear
      enterButton={false}
      style={{ marginBottom: 20, width: "100%", maxWidth: 500 }}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onSearch={(v) => {
        const q = (v || "").trim().toLowerCase();
        if (!q) return;
        const first = DocsNavigationButtons.find((b) =>
          (b.title || "").toLowerCase().includes(q) || (b.location || "").toLowerCase().includes(q)
        );
        if (first) navigate(first.location);
      }}
    />
    <Flex wrap gap='small' style={{ marginBottom: 20}}>
      {filteredButtons.map(({ location, icon, title, shape, size }) => (
          <Button
            type={isActive(location) ? "primary" : "default"}
            shape={shape}
            size={size}
            icon={icon}
            onClick={() => navigate(location)}
          >
            {title}
          </Button>
        
      ))}
    </Flex>
        </>

  );
}
