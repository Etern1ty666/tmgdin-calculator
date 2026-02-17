import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import store from "../../store/appStore";
import {
  Card,
  Typography,
  ColorPicker,
  Button,
  Divider,
  Select,
  Input,
  theme as antdTheme,
  Space,
} from "antd";
import { RightOutlined, ArrowLeftOutlined, UndoOutlined } from "@ant-design/icons";
import { gases as defaultGases, rooms as defaultRooms } from "../../data";

const { Text, Title } = Typography;

export default observer(function GasSettingsPanel({ onDetailChange }) {
  // store active gas by key so we always read the latest object from the store
  const [activeGasKey, setActiveGasKey] = useState(null);

  // no default active gas — panel will open with list view until user selects a gas

  const { token } = antdTheme.useToken();

  // derive colors from tokens with fallbacks
  const panelBg = token.colorBgContainer || "rgba(255,255,255,0.03)";
  const cardBorder = token.colorBorder || "rgba(255,255,255,0.07)";
  const itemBorder = token.colorSplit || "rgba(255,255,255,0.06)";
  const itemHover = token.colorFillTertiary || "rgba(255,255,255,0.06)";
  const titleColor = token.colorTextSecondary || "#ddd";

  // compute "changed" against defaults for core fields, and also detect changes to linkedRooms
  // linkedRooms base is derived from defaultRooms (not current store.rooms), so clearing or changing selection counts as a change
  const changed = useMemo(() => {
    try {
      const normalize = (arr) =>
        (arr || [])
          .map((g) => ({
            key: g.key,
            color: g.color ?? null,
            label: g.label ?? null,
            shortName: g.shortName ?? null,
          }))
          .sort((a, b) => (a.key > b.key ? 1 : a.key < b.key ? -1 : 0));

      const current = normalize(store.gases);
      const defaults = normalize(defaultGases);
      const coreChanged = JSON.stringify(current) !== JSON.stringify(defaults);

      // helper to get base linked rooms (derived from defaultRooms)
      const baseLinked = (gasKey) =>
        (defaultRooms || [])
          .filter((r) => (r.gases || []).some((gx) => gx.key === gasKey))
          .map((r) => r.key)
          .sort();

      const isArrEq = (a = [], b = []) => {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
        return true;
      };

      // changed if any gas linkedRooms differs from base (we persist linkedRooms always)
      const linkedChanged = (store.gases || []).some((g) => {
        const cur = Array.isArray(g.linkedRooms) ? [...g.linkedRooms].sort() : [];
        const base = baseLinked(g.key);
        return !isArrEq(cur, base);
      });

      return coreChanged || linkedChanged;
    } catch (e) {
      return false;
    }
  }, [store.gases]);

  // per-gas change detector (vs default values and defaultRooms-derived links)
  const isGasChanged = (g) => {
    if (!g) return false;
    const d = defaultGases.find((x) => x.key === g.key) || {};
    const coreDiff = (g.color ?? null) !== (d.color ?? null)
      || (g.label ?? null) !== (d.label ?? null)
      || (g.shortName ?? null) !== (d.shortName ?? null);
    const base = (defaultRooms || [])
      .filter((r) => (r.gases || []).some((gx) => gx.key === g.key))
      .map((r) => r.key)
      .sort();
    const cur = Array.isArray(g.linkedRooms) ? [...g.linkedRooms].sort() : [];
    const linksDiff = JSON.stringify(cur) !== JSON.stringify(base);
    return coreDiff || linksDiff;
  };

  const resetSingleGas = (key) => {
    const d = defaultGases.find((x) => x.key === key);
    if (!d) return;
    // reset core fields
    store.setGasColor(key, d.color);
    store.setGasParam(key, "label", d.label);
    store.setGasParam(key, "shortName", d.shortName);
    // reset linked rooms to defaults derived from defaultRooms
    const base = (defaultRooms || [])
      .filter((r) => (r.gases || []).some((gx) => gx.key === key))
      .map((r) => r.key);
    store.setGasLinkedRooms(key, base);
  };

  const handleColorChange = (key, color) => {
    let hex = "#000000";
    if (typeof color === "string") hex = color;
    else if (color && typeof color.toHexString === "function") hex = color.toHexString();
    store.setGasColor(key, hex);
  };

  const handleLabelChange = (key, field, value) => {
    // reuse generic setGasParam to set label / shortName
    store.setGasParam(key, field, value);
  };

  
  // Reset all gases to defaults including linked rooms derived from defaultRooms
  const handleReset = () => {
    try {
      (defaultGases || []).forEach((d) => {
        if (!d || !d.key) return;
        // reset core fields
        if (d.color !== undefined) store.setGasColor(d.key, d.color);
        if (d.label !== undefined) store.setGasParam(d.key, "label", d.label);
        if (d.shortName !== undefined) store.setGasParam(d.key, "shortName", d.shortName);
        // reset linked rooms from defaultRooms
        const base = (defaultRooms || [])
          .filter((r) => (r.gases || []).some((gx) => gx.key === d.key))
          .map((r) => r.key);
        store.setGasLinkedRooms(d.key, base);
      });
    } finally {
      setActiveGasKey(null);
      if (onDetailChange) onDetailChange(false);
    }
  };

  // === Render list ===
  const renderGasList = () => (
    <>
      
      <>
            <Title level={5}>Настройка газов</Title>
            <Text type="secondary">
              Изменяйте цвет, отображаемое имя и связанные помещения
            </Text>
          </>
      <Divider />

      <Card
        style={{
          background: panelBg,
          borderRadius: 14,
          margin: "0 8px",
          border: `1px solid ${cardBorder}`,
          overflow: "hidden",
        }}
        bodyStyle={{ padding: 0 }}
      >
        {store.gases.map((gas, index) => (
          <div
            key={gas.key}
            onClick={() => { setActiveGasKey(gas.key); if (onDetailChange) onDetailChange(true); }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              cursor: "pointer",
              borderBottom: index === store.gases.length - 1 ? "none" : `1px solid ${itemBorder}`,
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = itemHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Space size={12} align="center">
              <span style={{ fontSize: 20, color: gas.color }}>{gas.icon}</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <Text style={{ fontSize: 14, color: titleColor }}>{gas.label}</Text>
              </div>
            </Space>
            <RightOutlined style={{ color: "#888", fontSize: 12 }} />
          </div>
        ))}
      </Card>

      <br />

      {changed && (
        <Card
          style={{
            background: panelBg,
            borderRadius: 14,
            margin: "0 8px",
            border: `1px solid ${cardBorder}`,
            overflow: "hidden",
          }}
          bodyStyle={{ padding: 0 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = itemHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            onClick={handleReset}
          >
            <Space align="center" size={12}>
              <span style={{ fontSize: 20 }}>
                <UndoOutlined />
              </span>
              <Text style={{ fontSize: 14, color: titleColor }}>Сбросить настройки газов</Text>
            </Space>
            <RightOutlined style={{ color: "#888", fontSize: 12 }} />
          </div>
        </Card>
      )}
    </>
  );

  // Responsive helper
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 700 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    if (typeof window !== "undefined") window.addEventListener("resize", onResize);
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("resize", onResize);
    };
  }, []);

  // === Render detail ===
  const renderGasDetail = (gasKey) => {
    const gas = store.gases.find((g) => g.key === gasKey) || {};
      // no longer showing per-gas numeric params here; linkedRooms derive from rooms if missing
    return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            onClick={() => { setActiveGasKey(null); if (onDetailChange) onDetailChange(false); }}
            style={{ color: "#999" }}
          />
          <Title level={5} style={{ margin: 0 }}>{gas.label}</Title>
        </div>
        {isGasChanged(gas) && (
          <Button
            icon={<UndoOutlined />}
            type="text"
            onClick={() => resetSingleGas(gas.key)}
          >
            Сбросить
          </Button>
        )}
      </div>

      <Card
        className="gas-edit-card"
        style={{
          background: panelBg,
          borderRadius: 12,
          border: `1px solid ${cardBorder}`,
          margin: 0,
        }}
        bodyStyle={{ padding: isMobile ? "0 8px" : "0 12px" }}
      >
        {/* Two-column layout: left = parameter name, right = control */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, overflowX: "hidden" }}>
          {/* Color row */}
          <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 16, padding: "12px 0", flexDirection: isMobile ? "column" : "row" }}>
            <div style={{ flex: isMobile ? "unset" : "0 0 220px", minWidth: isMobile ? "unset" : 180, width: isMobile ? "100%" : undefined, display: "flex", alignItems: "center", justifyContent: "flex-start", textAlign: "left" }}>
              <Text style={{ color: titleColor, fontSize: 14 }}>Цвет отображения</Text>
            </div>
            <div style={{ flex: isMobile ? "unset" : 1, width: isMobile ? "100%" : undefined, minWidth: 0, display: "flex", justifyContent: isMobile ? "flex-start" : "flex-end" }}>
              <ColorPicker
                value={gas.color}
                showText
                onChange={(color, hex) => handleColorChange(gas.key, hex || color)}
                style={{ borderRadius: 16, minWidth: isMobile ? 0 : 140 }}
              />
            </div>
          </div>

          {/* Full name row */}
          <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 16, padding: "12px 0", flexDirection: isMobile ? "column" : "row" }}>
            <div style={{ flex: isMobile ? "unset" : "0 0 220px", minWidth: isMobile ? "unset" : 180, width: isMobile ? "100%" : undefined, display: "flex", alignItems: "center", justifyContent: "flex-start", textAlign: "left" }}>
              <Text style={{ color: titleColor, fontSize: 14 }}>Полное имя</Text>
            </div>
            <div style={{ flex: isMobile ? "unset" : 1, width: isMobile ? "100%" : undefined, minWidth: 0 }}>
              <Input
                value={gas.label || ""}
                onChange={(e) => handleLabelChange(gas.key, "label", e.target.value)}
                bordered={false}
                style={{ width: "100%", padding: 8, border: `1px solid ${cardBorder}`, background: token.colorBgContainer }}
              />
            </div>
          </div>

          {/* Short name row */}
          <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", gap: 16, padding: "12px 0", flexDirection: isMobile ? "column" : "row" }}>
            <div style={{ flex: isMobile ? "unset" : "0 0 220px", minWidth: isMobile ? "unset" : 180, width: isMobile ? "100%" : undefined, display: "flex", alignItems: "center", justifyContent: "flex-start", textAlign: "left" }}>
              <Text style={{ color: titleColor, fontSize: 14 }}>Короткое имя</Text>
            </div>
            <div style={{ flex: isMobile ? "unset" : 1, width: isMobile ? "100%" : undefined, minWidth: 0 }}>
              <Input
                value={gas.shortName || ""}
                onChange={(e) => handleLabelChange(gas.key, "shortName", e.target.value)}
                bordered={false}
                style={{ width: "100%", padding: 8, border: `1px solid ${cardBorder}`, background: token.colorBgContainer }}
              />
            </div>
          </div>

          {/* Linked rooms row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "12px 0", flexDirection: isMobile ? "column" : "row" }}>
            <div style={{ flex: isMobile ? "unset" : "0 0 220px", minWidth: isMobile ? "unset" : 180, width: isMobile ? "100%" : undefined, paddingTop: 6, display: "flex", alignItems: "flex-start", justifyContent: "flex-start", textAlign: "left" }}>
              <Text style={{ color: titleColor, fontSize: 14 }}>Привязанные помещения</Text>
            </div>
            <div style={{ flex: isMobile ? "unset" : 1, width: isMobile ? "100%" : undefined, minWidth: 0 }}>
              <Select
                mode="multiple"
                allowClear
                placeholder="Выберите помещения"
                value={
                  gas.linkedRooms ||
                  store.rooms
                    .filter((r) => (r.gases || []).some((gx) => gx.key === gas.key))
                    .map((r) => r.key)
                }
                options={store.rooms.map((r) => ({ label: r.name, value: r.key }))}
                onChange={(vals) => store.setGasLinkedRooms(gas.key, vals)}
                style={{ width: "100%" }}
                dropdownMatchSelectWidth={false}
                maxTagTextLength={20}
              />
            </div>
          </div>

          <Divider style={{ margin: "8px 0", opacity: 0.2 }} />
        </div>
      </Card>
    </>
    );
  };

  return (
    <Card
      style={{
        borderRadius: 16,
        background: "transparent",
        padding: 0,
        border: "none",
        boxShadow: "none",
      }}
      bodyStyle={{ padding: 0 }}
    >
      {!activeGasKey ? renderGasList() : renderGasDetail(activeGasKey)}
    </Card>
  );
});

