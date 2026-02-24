import React, { useEffect, useRef, useState } from "react";
import { Select, Typography, Tag, Tooltip, theme as antdTheme } from "antd";
import { CloseOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Option } = Select;

export default function RoomSelector({ rooms, selectedRooms, onChange }) {
  const { token } = antdTheme.useToken();
  const wrapperRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Lock body scroll when dropdown is open (mobile-friendly)
  useEffect(() => {
    if (!dropdownOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    const preventBodyScroll = (e) => {
      const root = wrapperRef.current;
      if (!root) return;
      // allow scrolling inside the dropdown container only
      if (root.contains(e.target)) return;
      if (e.cancelable) e.preventDefault();
    };
    document.addEventListener("touchmove", preventBodyScroll, { passive: false });

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      document.removeEventListener("touchmove", preventBodyScroll);
    };
  }, [dropdownOpen]);

  return (
    <div ref={wrapperRef}>
      {selectedRooms?.length > 0 && (
        <Text type="secondary" style={{ display: "inline-block", marginBottom: 10 }}>
          Выбрано помещений: <b>{selectedRooms.length}</b>
        </Text>
      )}

      <Select
        mode="multiple"
        allowClear
        showSearch
        style={{ width: "100%", textAlign: "left" }}
        placeholder="Выберите помещения..."
        value={selectedRooms}
        onChange={onChange}
        optionFilterProp="label"
  dropdownMatchSelectWidth
  listHeight={240}
        dropdownStyle={{
          borderRadius: token.borderRadiusLG,
          maxWidth: 630,
          overscrollBehavior: "contain",
        }}
        dropdownRender={(menu) => (
          <div
            style={{
              maxHeight: 260,
              overflowY: "auto",
              overscrollBehavior: "contain",
              WebkitOverflowScrolling: "touch",
            }}
            onTouchMove={(e) => {
              e.stopPropagation();
            }}
            onWheel={(e) => {
              e.stopPropagation();
            }}
          >
            {menu}
          </div>
        )}
        onDropdownVisibleChange={(open) => setDropdownOpen(!!open)}
        getPopupContainer={(trigger) => trigger.parentNode}
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
        maxTagCount={null}
        tagRender={({ label, closable, onClose }) => {
          const padY = (token.paddingXXS ?? 4);
          const padX = (token.paddingXS ?? 8);
          return (
            <Tag
              style={{
                borderRadius: token.borderRadius,
                padding: `${padY}px ${padX}px`,
                margin: 3,
                fontSize: token.fontSizeSM,
                display: "flex",
                alignItems: "center",
                gap: token.paddingXXS ?? 4,
                maxWidth: 220,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                background: token.colorPrimaryBg,
                color: token.colorPrimary,
                border: `1px solid ${token.colorBorder}`,
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {label}
              </span>
              {closable && (
                <CloseOutlined
                  onClick={(e) => {
                    e.preventDefault();
                    onClose();
                  }}
                  style={{
                    fontSize: token.fontSizeSM,
                    opacity: 0.65,
                    cursor: "pointer",
                    transition: "opacity 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.65")}
                />
              )}
            </Tag>
          );
        }}
      >
        {rooms.map((room) => (
          <Option key={room.key} value={room.key} label={room.name}>
            <Tooltip title={room.name}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {room.name}
                </span>
              </div>
            </Tooltip>
          </Option>
        ))}
      </Select>
    </div>
  );
}
