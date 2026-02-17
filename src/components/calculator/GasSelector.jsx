import React from "react";
import { Button, Tooltip, Typography, Flex, Space, theme as antdTheme } from "antd";
import {
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { gases as defaultGases } from "../../data"; // fallback

const { Text } = Typography;

export default function GasSelector({
  gases = defaultGases,
  selectedGases,
  setSelectedGases,
  visibleColumns,
  setVisibleColumns,
  onToggleGas, // optional: parent-controlled toggle to clear values on deselect
}) {
  const { token } = antdTheme.useToken();
  const toggleGas = (key) => {
    if (typeof onToggleGas === "function") {
      onToggleGas(key);
      return;
    }
    // fallback legacy behavior if parent does not handle
    setSelectedGases((prev) =>
      prev.includes(key) ? prev.filter((g) => g !== key) : [...prev, key]
    );
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]
    );
  };

  const toggleVisibility = (key, e) => {
    e.stopPropagation();
    setVisibleColumns((prev) =>
      prev.includes(key)
        ? prev.filter((col) => col !== key)
        : [...prev, key]
    );
  };

  const selectAll = () => {
    setSelectedGases(gases.map((g) => g.key));
    setVisibleColumns(gases.map((g) => g.key));
  };

  const clearAll = () => {
    setSelectedGases([]);
    setVisibleColumns([]);
  };

  return (
    <Flex
      vertical
      gap="large"
      align="center"
      justify="center"
      style={{ width: "100%" }}
    >
      {/* Сетка кнопок */}
      <Flex wrap="wrap" gap="middle" align="center" justify="center">
  {gases.map((gas) => {
          const selected = selectedGases.includes(gas.key);
          const visible = visibleColumns.includes(gas.key);

          return (
            <div
              key={gas.key}
              style={{
                position: "relative",
                textAlign: "center",
                margin: 8,
              }}
            >
              <Tooltip
                title={
                  <>
                    <div style={{ fontWeight: 500 }}>{gas.shortName || gas.label}</div>
                    <div style={{ opacity: 0.7, fontSize: 12 }}>
                      {visible
                        ? "Отображается в таблице"
                        : "Скрыт из таблицы"}
                    </div>
                  </>
                }
              >
                <Button
                  shape="circle"
                  size="large"
                  icon={gas.icon}
                  onClick={() => toggleGas(gas.key)}
                  style={{
                    background: selected ? gas.color : "transparent",
                    color: selected ? token.colorTextLightSolid : gas.color,
                    borderColor: gas.color,
                    width: 60,
                    height: 60,
                    fontSize: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    boxShadow: selected
                      ? `0 0 0 ${token.controlOutlineWidth || 2}px ${gas.color}55`
                      : "none",
                  }}
                />

                {/* Индикатор видимости */}
                {selected && (
                  <div
                    onClick={(e) => toggleVisibility(gas.key, e)}
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      background: visible ? gas.color : token.colorFillSecondary,
                      color: token.colorTextLightSolid,
                      borderRadius: "50%",
                      padding: token.paddingXXS || 4,
                      fontSize: token.fontSizeSM,
                      cursor: "pointer",
                      boxShadow: token.boxShadowSecondary,
                    }}
                  >
                    {visible ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  </div>
                )}
              </Tooltip>

              <Text
                style={{
                  marginTop: 6,
                  display: "block",
                  fontSize: 13,
                }}
              >
                {gas.shortName || gas.label}
              </Text>
            </div>
          );
        })}
      </Flex>
    </Flex>
  );
}
