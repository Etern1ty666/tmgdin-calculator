import React, { useState, useMemo, useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { useSearchParams } from "react-router-dom";
import store from "../store/appStore";
import {
  Card,
  Menu,
  Typography,
  Flex,
  Switch,
  Divider,
  Select,
  InputNumber,
  Button,
  message,
  ColorPicker,
  Modal,
  Space,
  ConfigProvider,
  theme as antdTheme,
} from "antd";
import {
  BgColorsOutlined,
  CloudDownloadOutlined,
  InfoCircleOutlined,
  ExperimentOutlined,
  HomeOutlined,
  SendOutlined,
  DownloadOutlined,
  RightOutlined,
  UploadOutlined,
  DiffOutlined,
  SwapOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import { gases as gasesData, rooms as roomsData } from "../data";
import GasSettingsPanel from "../components/settings/GasSettingsPanel";
import RoomsSettingsPanel from "../components/settings/RoomsSettingsPanel";
import AppearancePanel from "../components/settings/AppereancePanel";

const { Title, Text } = Typography;
const { Option } = Select;

export default observer(function SettingsLayout() {
  const { token } = antdTheme.useToken();
  const [searchParams] = useSearchParams();
  
  // Check URL params for initial tab
  const urlTab = searchParams.get('tab');
  
  // Determine initial viewport for mobile-first behavior
  const initialMobile = typeof window !== "undefined" ? window.innerWidth < 700 : false;
  const [activeKey, setActiveKey] = useState(initialMobile ? "" : (urlTab || "gases"));
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [pendingImportData, setPendingImportData] = useState(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 700 : false
  );
  const [mobileView, setMobileView] = useState(urlTab && !initialMobile ? "content" : "menu"); // 'menu' | 'content'
  const [ignoreMenuClicksUntil, setIgnoreMenuClicksUntil] = useState(0);
  const [gasDetailOpen, setGasDetailOpen] = useState(false);
  const [roomDetailOpen, setRoomDetailOpen] = useState(false);

  const goBackToMenu = useCallback(() => {
    setIgnoreMenuClicksUntil(Date.now() + 250);
    setMobileView("menu");
    setActiveKey("");
  }, []);

  useEffect(() => {
    let prevIsMobile = typeof window !== "undefined" ? window.innerWidth < 700 : false;
    const onResize = () => {
      const m = window.innerWidth < 700;
      setIsMobile(m);
      // Only switch to menu when crossing from desktop -> mobile
      if (m && !prevIsMobile) {
        setMobileView("menu");
      }
      // When crossing mobile -> desktop, ensure some tab is selected
      if (!m && prevIsMobile && !activeKey) {
        setActiveKey("gases");
      }
      prevIsMobile = m;
    };
    if (typeof window !== "undefined") window.addEventListener("resize", onResize);
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("resize", onResize);
    };
  }, [activeKey]);

  // Ensure that when we're in mobile menu view, no item is selected
  useEffect(() => {
    if (isMobile && mobileView === "menu" && activeKey) {
      setActiveKey("");
    }
  }, [isMobile, mobileView]);

  // Индикаторы изменений по разделам
  const gasesChanged = useMemo(() => {
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
      const defaults = normalize(gasesData);
      return JSON.stringify(current) !== JSON.stringify(defaults);
    } catch {
      return false;
    }
  }, [store.gases]);
  const roomsChanged = useMemo(
    () => JSON.stringify(store.rooms) !== JSON.stringify(roomsData),
    [store.rooms]
  );

  // Проверка изменений для кнопки сброса
  // useEffect(() => {
  //   const diff =
  //     JSON.stringify(store.gases) !== JSON.stringify(gasesData) ||
  //     JSON.stringify(store.rooms) !== JSON.stringify(roomsData);
  //   setChanged(diff);
  // }, [store.gases, store.rooms]);

  const handleReset = () => {
    store.setGases(gasesData);
    store.setRooms(roomsData);
    // setChanged(false);
    store.resetGases();
    message.success("Настройки сброшены!");
  };

  // persistence now handled by MobX store (appStore)

  // ========== МЕНЮ ==========
  const menuItems = [
    { key: "gases", icon: <ExperimentOutlined />, label: "Газы" },
    { key: "rooms", icon: <HomeOutlined />, label: "Помещения" },
    { key: "appearance", icon: <BgColorsOutlined />, label: "Оформление" },
        { key: "export", icon: <SwapOutlined />, label: "Перенос" },
    { key: "about", icon: <InfoCircleOutlined />, label: "О приложении" },
  ];

  // ========== ВКЛАДКИ ==========
  const renderAppearance = () => (
    <>
      <AppearancePanel />
    </>
  );

  // === Новый macOS стиль для газов ===
  const renderGases = () => (
    <GasSettingsPanel
      gases={store.gases}
      setGases={(g) => store.setGases(g)}
      changed={gasesChanged}
      onDetailChange={(v) => setGasDetailOpen(!!v)}
      onReset={() => {
        store.setGases(gasesData);
        if (typeof store.resetGases === "function") store.resetGases();
        message.success("Настройки газов сброшены!");
      }}
    />
  );

  const renderRooms = () => (
    <RoomsSettingsPanel
      changed={roomsChanged}
      onDetailChange={(v) => setRoomDetailOpen(!!v)}
      onReset={() => {
        store.setRooms(roomsData);
        message.success("Настройки помещений сброшены!");
      }}
    />
  );

  const renderExport = () => (
    <>
      {/* Provide hooks for inner components to hide back or navigate back if they implement it */}
      <div style={{ display: 'none' }}>
        {/* reserved */}
      </div>
      <Title level={5}>Перенос настроек</Title>
      <Text type="secondary">
        Сохраните свои настройки или перенесите их на другое устройство.
      </Text>
      <Divider />
      <>
        <Card
          style={{
            borderRadius: 14,
            margin: "0 8px",
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
            onClick={() => {
              // export only serializable parts of gases (no icons / functions)
              const exportGases = store.gases.map((g) => ({
                key: g.key,
                color: g.color,
                ...(g.flowRate !== undefined ? { flowRate: g.flowRate } : {}),
                ...(g.hoursPerDay !== undefined ? { hoursPerDay: g.hoursPerDay } : {}),
                ...(g.usageFactor !== undefined ? { usageFactor: g.usageFactor } : {}),
              }));

              const data = { theme: store.theme, gases: exportGases, rooms: store.rooms };
              const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "medgas_settings.json";
              a.click();
              URL.revokeObjectURL(url);
              message.success("Настройки успешно экспортированы!");
            }}
          >
            <Space align="center" size={12}>
              <span style={{ fontSize: 20 }}>
                <DownloadOutlined />{" "}
              </span>
              <Text style={{ fontSize: 14 }}>Скачать текущие настройки</Text>
            </Space>
            <RightOutlined style={{ color: "#888", fontSize: 12 }} />
          </div>
        </Card>
        <br />
        <Card
          style={{
            borderRadius: 14,
            margin: "0 8px",
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
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "application/json";
              input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const imported = JSON.parse(event.target.result);

                    // build preview: theme change
                    const preview = {
                      themeChange:
                        imported.theme && imported.theme !== store.theme
                          ? { from: store.theme, to: imported.theme }
                          : null,
                      gasesChanges: [],
                      roomsInfo: imported.rooms ? { count: imported.rooms.length } : null,
                    };

                    if (Array.isArray(imported.gases)) {
                      imported.gases.forEach((ig) => {
                        const current = store.gases.find((g) => g.key === ig.key) || gasesData.find((g) => g.key === ig.key);
                        if (current) {
                          const changes = [];
                          if (ig.color && ig.color !== current.color) changes.push({ field: 'color', from: current.color, to: ig.color });
                          if (ig.flowRate !== undefined && ig.flowRate !== current.flowRate) changes.push({ field: 'flowRate', from: current.flowRate, to: ig.flowRate });
                          if (ig.hoursPerDay !== undefined && ig.hoursPerDay !== current.hoursPerDay) changes.push({ field: 'hoursPerDay', from: current.hoursPerDay, to: ig.hoursPerDay });
                          if (ig.usageFactor !== undefined && ig.usageFactor !== current.usageFactor) changes.push({ field: 'usageFactor', from: current.usageFactor, to: ig.usageFactor });
                          if (changes.length) preview.gasesChanges.push({ key: ig.key, label: current.label, changes });
                        }
                      });
                    }

                    setPendingImportData(imported);
                    setImportPreview(preview);
                    setImportModalVisible(true);
                  } catch (err) {
                    console.error('Import parse error', err);
                    message.error('Ошибка при чтении файла.');
                  }
                };
                reader.readAsText(file);
              };
              input.click();
            }}
          >
            <Space align="center" size={12}>
              <span style={{ fontSize: 20 }}>
                <DiffOutlined />{" "}
              </span>
              <Text style={{ fontSize: 14 }}>Импортировать настройки из файла</Text>
            </Space>
            <RightOutlined style={{ color: "#888", fontSize: 12 }} />
          </div>
        </Card>
      </>
    </>
  );

  // Apply pending import as a merge (apply provided fields only)
  const applyImportMerge = (imported) => {
    if (!imported) return;
    if (Array.isArray(imported.gases)) {
      const merged = store.gases.map((d) => ({
        ...d,
        ...(imported.gases.find((x) => x.key === d.key) || {}),
      }));
      store.setGases(merged);
    }
    if (imported.theme) store.setTheme(imported.theme);
    // rooms are not changed on merge to avoid surprising replacements
    message.success('Импорт (merge) применён');
    setImportModalVisible(false);
    setPendingImportData(null);
    setImportPreview(null);
  };

  // Apply pending import as replace (replace gases/rooms)
  const applyImportReplace = (imported) => {
    if (!imported) return;
    if (Array.isArray(imported.gases)) {
      const merged = gasesData.map((d) => ({
        ...d,
        ...(imported.gases.find((x) => x.key === d.key) || {}),
      }));
      store.setGases(merged);
    } else if (imported.gases) {
      store.setGases(imported.gases);
    }
    store.setRooms(imported.rooms || roomsData);
    store.setTheme(imported.theme || store.theme);
    message.success('Настройки импортированы (replace)');
    setImportModalVisible(false);
    setPendingImportData(null);
    setImportPreview(null);
  };

  const renderAbout = () => (
    <>
      <div style={{ display: 'none' }}>
        {/* hideBackButton: {String(isMobile && mobileView === 'content')} */}
      </div>
      <Title level={5}>О приложении</Title>
      <Text type="secondary">
        <b>Калькулятор медицинских газов</b> — инструмент для проектировщиков
        и инженеров, созданный для упрощения расчётов по СП 158.13330.2014
      </Text>
      <Divider />
      
      {/* Patch Notes Card */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          background: token.colorBgContainer,
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
            Версия 0.1.1
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            27 ноября 2025
          </Text>
        </div>
        <Divider style={{ margin: '12px 0' }} />
        <div style={{ textAlign: 'left' }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Что нового:
          </Text>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
            <li>Добавлена стоматология в список палат</li>
            <li>Добавлены подсказки о заполнении <code>n2o</code>, <code>agss</code>, <code>air</code></li>
            <li>Отчет в Excel стал более подробным (добавлены количество помещений, количество точек, детальная информация по расходам и трубопроводам)</li>
            <li>Улучшен расчет диаметра труб</li>
            <li>Исправлено представление из м³/ч на л/мин в отображении и экспортах</li>
            <li>Исправлен нечитаемый текст в подсказках в таблице результатов</li>
            <li>Обновлены параметры для вакуума всех палат</li>
          </ul>
        </div>
      </Card>

      {/* Version at bottom */}
      <div style={{ textAlign: 'center', marginTop: 32, paddingTop: 16, borderTop: `1px solid ${token.colorBorderSecondary}` }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Версия <b>0.1.1</b>
        </Text>
      </div>
    </>
  );

  const renderContent = () => {
    // leaving a section should clear detail flags
    // ensure flags are reset when switching sections
    // handled via effect below
    switch (activeKey) {
      case "appearance":
        return renderAppearance();
      case "gases":
        return renderGases();
      case "rooms":
        return renderRooms();
      case "export":
        return renderExport();
      case "about":
        return renderAbout();
      default:
        return null;
    }
  };

  // Reset detail flags when tab changes or when returning to menu
  useEffect(() => {
    setGasDetailOpen(false);
    setRoomDetailOpen(false);
  }, [activeKey, mobileView]);

  return (
    <Card
      style={{
        width: "100%",
        maxWidth: 980,
        margin: "0 auto",
      }}
      bodyStyle={{ padding: 0 }}
    >
      {isMobile ? (
        <div style={{ width: "100%" }}>
          {mobileView === "menu" && (
            <Card size="small" style={{ margin: 12 }} bodyStyle={{ padding: 0 }}>
              <ConfigProvider
                theme={{
                  components: {
                    Menu: {
                      itemBorderRadius: token.borderRadius,
                      itemSelectedBg: token.colorPrimaryBg,
                      itemHoverBg: token.colorFillTertiary,
                      itemBg: "transparent",
                      subMenuItemBg: "transparent",
                    },
                  },
                }}
              >
                <Menu
                  mode="inline"
                  selectedKeys={activeKey ? [activeKey] : []}
                  onClick={({ key }) => {
                    if (Date.now() < ignoreMenuClicksUntil) return; // ignore ghost click after back
                    setActiveKey(key);
                    setMobileView("content");
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    borderInlineEnd: "none",
                  }}
                  items={menuItems.map((item) => ({
                    key: item.key,
                    label: (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                        }}
                      >
                        <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>
                        <span style={{ fontSize: 14 }}>{item.label}</span>
                      </div>
                    ),
                  }))}
                />
              </ConfigProvider>
            </Card>
          )}

          {mobileView === "content" && (
            <div
              key={activeKey}
              style={{
                padding: "16px 16px 24px",
                minHeight: "70vh",
                minWidth: 0,
                overflowX: "hidden",
              }}
            >
              {!(activeKey === 'gases' && gasDetailOpen) && !(activeKey === 'rooms' && roomDetailOpen) && (
                <div style={{ marginBottom: 12, marginLeft: -16, marginRight: -16 }}>
                  <Button
                    type="text"
                    icon={<LeftOutlined />}
                    onClick={(e) => {
                      // Prevent click bubbling causing an immediate menu item click underneath
                      e.preventDefault();
                      e.stopPropagation();
                      // Defer view switch slightly to let the click finish
                      setTimeout(goBackToMenu, 30);
                    }}
                    style={{ paddingLeft: 16 }}
                  >
                    Назад
                  </Button>
                </div>
              )}
              {renderContent()}
            </div>
          )}
        </div>
      ) : (
        <Flex align="flex-start" style={{ width: "100%" }}>
          {/* Меню */}
          <Card
            size="small"
            style={{
              width: 220,
              margin: 16,
            }}
          >
            <ConfigProvider
              theme={{
                components: {
                  Menu: {
                    itemBorderRadius: token.borderRadius,
                    itemSelectedBg: token.colorPrimaryBg,
                    itemHoverBg: token.colorFillTertiary,
                    itemBg: "transparent",
                    subMenuItemBg: "transparent",
                  },
                },
              }}
            >
              <Menu
                mode="inline"
                selectedKeys={activeKey ? [activeKey] : []}
                onClick={({ key }) => setActiveKey(key)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  borderInlineEnd: "none",
                }}
                items={menuItems.map((item) => ({
                  key: item.key,
                  label: (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16, // минимальный зазор (можно 0 если хочешь вообще без)
                      }}
                    >
                      <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>
                      <span style={{ fontSize: 14 }}>{item.label}</span>
                    </div>
                  ),
                }))}
              />
            </ConfigProvider>
          </Card>

          {/* Контент */}
          <div
            key={activeKey}
            style={{
              flex: 1,
              padding: "24px 32px",
              minHeight: "70vh",
              minWidth: 0,
              overflowX: "hidden",
            }}
          >
            {renderContent()}
          </div>
        </Flex>
      )}
      {/* Import preview modal */}
      <Modal
        open={importModalVisible}
        title="Импорт — подтвердите изменения"
        onCancel={() => {
          setImportModalVisible(false);
          setPendingImportData(null);
          setImportPreview(null);
        }}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => { setImportModalVisible(false); setPendingImportData(null); setImportPreview(null); }}>Отмена</Button>
            <Button onClick={() => applyImportMerge(pendingImportData)}>Merge (только поля)</Button>
            <Button type="primary" danger onClick={() => applyImportReplace(pendingImportData)}>Replace (полностью)</Button>
          </div>
        }
      >
        {!importPreview && <div>Нет данных для предпросмотра</div>}
        {importPreview && (
          <div>
            {importPreview.themeChange && (
              <div style={{ marginBottom: 12 }}>
                <b>Тема:</b> {importPreview.themeChange.from} → {importPreview.themeChange.to}
              </div>
            )}

            {importPreview.gasesChanges && importPreview.gasesChanges.length > 0 ? (
              <div>
                <b>Изменения в газах:</b>
                <div style={{ marginTop: 8 }}>
                  {importPreview.gasesChanges.map((g) => (
                    <div key={g.key} style={{ padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <div style={{ fontWeight: 600 }}>{g.label}</div>
                      {g.changes.map((c, i) => (
                        <div key={i} style={{ fontSize: 13 }}>
                          • {c.field}: {String(c.from)} → <b>{String(c.to)}</b>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>Нет изменений в газах.</div>
            )}

            {importPreview.roomsInfo && (
              <div style={{ marginTop: 12 }}>
                <b>Помещения:</b> импорт содержит {importPreview.roomsInfo.count} записей (будут применены при Replace).
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
});
