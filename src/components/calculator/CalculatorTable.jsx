import React, { useEffect, useState } from "react";
import { Table, InputNumber, Tooltip, Typography } from "antd";

const { Text } = Typography;

// лёгкая подложка из hex
const tint = (hex, a = 0.1) => {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export default function CalculatorTable({
  rooms,
  gases,
  selectedGases,
  values,
  createChangeHandler,
  focusedCell,
  setFocusedCell,
  summaryData,
  visibleColumns,
}) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 700 : false
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700);
    if (typeof window !== "undefined") {
      window.addEventListener("resize", onResize);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", onResize);
      }
    };
  }, []);
  const visibleGases = gases.filter(
    (g) =>
      selectedGases.includes(g.key) &&
      (!visibleColumns || visibleColumns.includes(g.key))
  );

  const columns = [
    {
      title: "Помещения / количество точек",
      dataIndex: "name",
      key: "name",
      width: isMobile ? 120 : 260,
      fixed: "left",
      ellipsis: { showTitle: false },
      onCell: () => ({
        style: {
          maxWidth: isMobile ? 120 : 260,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      }),
      render: (text, record) => {
        const content = record.type === "section" ? (
          <Text strong>{text}</Text>
        ) : (
          <span>{text}</span>
        );
        return (
          <Tooltip title={text} placement="topLeft">
            <div
              style={{
                display: "block",
                maxWidth: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {content}
            </div>
          </Tooltip>
        );
      },
    },
    ...visibleGases.map((gas) => ({
      title: (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            background: tint(gas.color, 0.12),
            border: `1px solid ${tint(gas.color, 0.35)}`,
            borderRadius: 16,
            color: gas.color,
            lineHeight: 1,
          }}
        >
          <span style={{ color: gas.color, fontSize: 16 }}>{gas.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{gas.shortName || gas.label}</span>
        </div>
      ),
      dataIndex: gas.key,
      key: gas.key,
      align: "center",
      width: 120,
      render: (_, record) => {
        if (record.type === "section") return null;

        const hasGas = record.gases?.some((gg) => gg.key === gas.key);
        if (!hasGas) return "—";

        const isFocused =
          focusedCell?.roomKey === record.key &&
          focusedCell?.gasKey === gas.key;

        return (
          <Tooltip
            title={gas.label}
            open={isFocused ? true : undefined}
            placement="top"
          >
            <InputNumber
              min={0}
              value={values[record.key]?.[gas.key]}
              onChange={createChangeHandler(record.key, gas.key)}
              onFocus={() => setFocusedCell({ roomKey: record.key, gasKey: gas.key })}
              onBlur={() => setFocusedCell(null)}
              style={{
                width: "86px",
                borderColor: isFocused ? gas.color : undefined,
                boxShadow: isFocused ? `0 0 0 2px ${tint(gas.color, 0.25)}` : "none",
              }}
            />
          </Tooltip>
        );
      },
      onHeaderCell: () => ({
      }),
    })),
  ];

  return (
    <Table
      style={{ margin: isMobile ? "0 0 12px 0" : 20 }}
      bordered
      pagination={false}
      columns={columns}
      dataSource={rooms}
      rowKey="key"
      scroll={{ x: "max-content" }}
      sticky
      summary={() => (
        <Table.Summary.Row>
          <Table.Summary.Cell>
            <Text strong>Итого</Text>
          </Table.Summary.Cell>
          {visibleGases.map((g) => (
            <Table.Summary.Cell key={g.key} align="center">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "2px 8px",

                }}
              >
                <span style={{ color: g.color, fontSize: 14 }}>{g.icon}</span>
                <Text style={{fontWeight: 600 }}>
                  {summaryData[g.key] ?? 0}
                </Text>
              </div>
            </Table.Summary.Cell>
          ))}
        </Table.Summary.Row>
      )}
    />
  );
}
