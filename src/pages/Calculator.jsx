import React, { useState, useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import store from "../store/appStore";
import { Flex, Typography, Empty, Button, Alert, message } from "antd";
import { DownloadOutlined, WarningOutlined } from "@ant-design/icons";
import GasSelector from "../components/calculator/GasSelector";
import CalculatorTable from "../components/calculator/CalculatorTable";
import RoomSelector from "../components/calculator/RoomSelector";
import { CalculatorPageLayout, CalculatorCenteredBlock } from "../components/calculator/CalculatorLayout";
import OxygenResult from "../components/calculator/sections/OxygenResult";
import N2OResult from "../components/calculator/sections/N2OResult";
import AirResult from "../components/calculator/sections/AirResult";
import CO2Result from "../components/calculator/sections/CO2Result";
import VacuumResult from "../components/calculator/sections/VacuumResult";

const { Text } = Typography;

// ======== LOCAL STORAGE KEYS & HELPERS (module scope to avoid hook deps) ========
const LS_KEYS = {
  selectedGases: "calc:selectedGases",
  selectedRooms: "calc:selectedRooms",
  visibleColumns: "calc:visibleColumns",
  values: "calc:values",
};

const safeParse = (str, fallback) => {
  try {
    const v = JSON.parse(str);
    return v ?? fallback;
  } catch (_) {
    return fallback;
  }
};

export default observer(function Calculator() {
  // Build initial state synchronously from localStorage to avoid hydration flicker
  const gasKeys = new Set((store.gases || []).map((g) => g.key));
  const roomKeys = new Set((store.rooms || []).map((r) => r.key));

  const initValues = () => {
    const savedValues = safeParse(localStorage.getItem(LS_KEYS.values), null);
    if (savedValues && typeof savedValues === "object") {
      const pruned = {};
      Object.keys(savedValues).forEach((roomKey) => {
        if (!roomKeys.has(roomKey)) return;
        const row = savedValues[roomKey] || {};
        const prunedRow = {};
        Object.keys(row).forEach((gasKey) => {
          if (gasKeys.has(gasKey)) prunedRow[gasKey] = row[gasKey];
        });
        if (Object.keys(prunedRow).length) pruned[roomKey] = prunedRow;
      });
      return pruned;
    }
    return {};
  };

  const initSelectedGases = () => {
    const savedGases = safeParse(localStorage.getItem(LS_KEYS.selectedGases), null);
    const filtered = Array.isArray(savedGases) ? savedGases.filter((k) => gasKeys.has(k)) : null;
    return filtered && filtered.length ? filtered : ["oxygen"];
  };

  const initVisibleColumns = () => {
    const savedVisible = safeParse(localStorage.getItem(LS_KEYS.visibleColumns), null);
    const filtered = Array.isArray(savedVisible) ? savedVisible.filter((k) => gasKeys.has(k)) : null;
    return filtered && filtered.length ? filtered : ["oxygen"];
  };

  const initSelectedRooms = (initialValues) => {
    const savedRooms = safeParse(localStorage.getItem(LS_KEYS.selectedRooms), null);
    const filtered = Array.isArray(savedRooms) ? savedRooms.filter((k) => roomKeys.has(k)) : null;
    if (filtered && filtered.length) return filtered;
    // Fallback: derive rooms from saved values
    const fromValues = initialValues ? Object.keys(initialValues).filter((k) => roomKeys.has(k)) : [];
    return fromValues;
  };

  const initialValues = initValues();
  const [values, setValues] = useState(() => initialValues);
  const [focusedCell, setFocusedCell] = useState(null);
  const [selectedGases, setSelectedGases] = useState(() => initSelectedGases());
  const [selectedRooms, setSelectedRooms] = useState(() => initSelectedRooms(initialValues));
  const [visibleColumns, setVisibleColumns] = useState(() => initVisibleColumns());

  // Persist on changes
  useEffect(() => {
    localStorage.setItem(LS_KEYS.selectedGases, JSON.stringify(selectedGases));
  }, [selectedGases]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.visibleColumns, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.selectedRooms, JSON.stringify(selectedRooms));
  }, [selectedRooms]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.values, JSON.stringify(values));
  }, [values]);

  // ✅ Удаляем значения помещений, если они сняты
  useEffect(() => {
    setValues((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((roomKey) => {
        if (!selectedRooms.includes(roomKey)) delete updated[roomKey];
      });
      return updated;
    });
  }, [selectedRooms]);

  const createChangeHandler = useCallback(
    (roomKey, gasKey) => (value) => {
      setValues((prev) => ({
        ...prev,
        [roomKey]: { ...prev[roomKey], [gasKey]: value },
      }));
    },
    []
  );

  const handleSelectRooms = (vals) => setSelectedRooms(vals);

  // Очистка всех данных: сброс к дефолту (только кислород, без помещений, пустые значения)
  const handleResetAll = () => {
    try {
      // Сначала очистим сохранённые данные
      Object.values(LS_KEYS).forEach((k) => localStorage.removeItem(k));
    } catch (_) {}
    // Затем сбросим состояние
    setSelectedGases(["oxygen"]);
    setVisibleColumns(["oxygen"]);
    setSelectedRooms([]);
    setValues({});
    setFocusedCell(null);
  };

  const filteredRooms = store.rooms.filter((r) => selectedRooms.includes(r.key));

  // Валидация: если у помещения есть AGSS, обязательно нужен Air5 или Air8
  const roomsWithAGSSOnly = filteredRooms.filter((room) => {
    const agssCount = Number(values[room.key]?.agss || 0);
    const air5Count = Number(values[room.key]?.air5 || 0);
    const air8Count = Number(values[room.key]?.air8 || 0);
    return agssCount > 0 && air5Count === 0 && air8Count === 0;
  });

  // Валидация: если у помещения есть N2O, обязательно нужны AGSS и Air
  const roomsWithN2OWithoutAGSSorAir = filteredRooms.filter((room) => {
    const n2oCount = Number(values[room.key]?.n2o || 0);
    const agssCount = Number(values[room.key]?.agss || 0);
    const air5Count = Number(values[room.key]?.air5 || 0);
    const air8Count = Number(values[room.key]?.air8 || 0);
    const hasAir = air5Count > 0 || air8Count > 0;
    return n2oCount > 0 && (agssCount === 0 || !hasAir);
  });

  const summaryData = store.gases.reduce((acc, gas) => {
    acc[gas.key] = selectedRooms.reduce(
      (sum, r) => sum + (values[r]?.[gas.key] || 0),
      0
    );
    return acc;
  }, {});

  // === Определяем состояние для отображения ===
  const noGases = selectedGases.length === 0;
  const noRooms = selectedRooms.length === 0;
  const showEmptyState = noGases || noRooms;

  let emptyMessage = "";
  if (noGases && noRooms)
    emptyMessage = "Выберите хотя бы один газ и помещение для расчета";
  else if (noGases) emptyMessage = "Выберите хотя бы один газ";
  else if (noRooms) emptyMessage = "Выберите хотя бы одно помещение";

  // === Проверка: показывать ли карточки ===
  const hasVisibleColumns = visibleColumns.length > 0 && !showEmptyState;

  const [exporting, setExporting] = useState(false);
  const handleExportAll = async () => {
    setExporting(true);
    try {
      const { downloadCalculationWorkbook } = await import("../components/calculator/exportExcel");
      await downloadCalculationWorkbook(filteredRooms, values);
    } catch (error) {
      console.error("Excel export failed", error);
      message.error("Не удалось сформировать Excel. Повторите скачивание.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <CalculatorPageLayout>
      {/* ======== ВЫБОР ГАЗОВ ======== */}
      <CalculatorCenteredBlock>
        <GasSelector
          gases={store.gases}
          selectedGases={selectedGases}
          setSelectedGases={setSelectedGases}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          onToggleGas={(gasKey) => {
            setSelectedGases((prev) => {
              const isSelected = prev.includes(gasKey);
              const next = isSelected ? prev.filter((g) => g !== gasKey) : [...prev, gasKey];
              return next;
            });
            setVisibleColumns((prev) => {
              const isVisible = prev.includes(gasKey);
              // keep visibility in sync with selection when toggling via main button
              return isVisible ? prev.filter((c) => c !== gasKey) : [...prev, gasKey];
            });
            // if deselecting gas -> clear its values across all rooms
            setValues((prev) => {
              const updated = { ...prev };
              let changed = false;
              Object.keys(updated).forEach((roomKey) => {
                if (updated[roomKey] && Object.prototype.hasOwnProperty.call(updated[roomKey], gasKey)) {
                  const { [gasKey]: _removed, ...rest } = updated[roomKey];
                  updated[roomKey] = rest;
                  changed = true;
                  if (Object.keys(rest).length === 0) {
                    delete updated[roomKey];
                  }
                }
              });
              return changed ? updated : prev;
            });
          }}
        />
      </CalculatorCenteredBlock>

      {/* ======== ВЫБОР ПОМЕЩЕНИЙ ======== */}
      <CalculatorCenteredBlock>
        <RoomSelector
          rooms={store.rooms}
          selectedRooms={selectedRooms}
          onChange={handleSelectRooms}
        />
      </CalculatorCenteredBlock>

      {/* ======== ТАБЛИЦА ИЛИ СООБЩЕНИЕ ======== */}
      {showEmptyState ? (
        <div
          style={{
            width: "100%",
            maxWidth: 640,
            margin: "30px auto",
            padding: "40px 20px",
            border: "1px dashed #d9d9d9",
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <Empty
            description={
              <Text style={{ color: "#888", fontSize: 14 }}>{emptyMessage}</Text>
            }
          />
        </div>
      ) : (
        <>
        <CalculatorTable
          rooms={filteredRooms}
          gases={store.gases}
          selectedGases={selectedGases}
          values={values}
          createChangeHandler={createChangeHandler}
          focusedCell={focusedCell}
          setFocusedCell={setFocusedCell}
          summaryData={summaryData}
          visibleColumns={visibleColumns}
        />
        {/* Validation warning: AGSS requires Air */}
        {roomsWithAGSSOnly.length > 0 && (
          <div style={{ maxWidth: 640, margin: "16px auto", width: "100%" }}>
            <Alert
              type="warning"
              showIcon={false}
              message={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <WarningOutlined style={{ fontSize: 16, color: '#faad14' }} />
                  <span style={{ fontWeight: 600, fontSize: 15 }}>Требуется медицинский воздух</span>
                </div>
              }
              description={
                <div style={{ textAlign: 'left' }}>
                  Для помещений с AGSS обязательно нужен медицинский воздух (Air 5 или Air 8):
                  <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                    {roomsWithAGSSOnly.map((room) => (
                      <li key={room.key}>{room.name || room.key}</li>
                    ))}
                  </ul>
                </div>
              }
            />
          </div>
        )}
        {/* Validation warning: N2O requires AGSS and Air */}
        {roomsWithN2OWithoutAGSSorAir.length > 0 && (
          <div style={{ maxWidth: 640, margin: "16px auto", width: "100%" }}>
            <Alert
              type="warning"
              showIcon={false}
              message={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <WarningOutlined style={{ fontSize: 16, color: '#faad14' }} />
                  <span style={{ fontWeight: 600, fontSize: 15 }}>Требуется AGSS и медицинский воздух</span>
                </div>
              }
              description={
                <div style={{ textAlign: 'left' }}>
                  Для помещений с закисью азота (N₂O) обязательно нужны AGSS и медицинский воздух (Air 5 или Air 8):
                  <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                    {roomsWithN2OWithoutAGSSorAir.map((room) => (
                      <li key={room.key}>{room.name || room.key}</li>
                    ))}
                  </ul>
                </div>
              }
            />
          </div>
        )}
        {/* Export and Reset buttons */}
        {hasVisibleColumns && (
          <div style={{ maxWidth: 640, margin: "8px auto 0", width: "100%" }}>
            <Flex justify="center" gap={8} wrap>
              <Button danger onClick={handleResetAll}>Очистить все</Button>
              <Button icon={<DownloadOutlined />} onClick={handleExportAll} loading={exporting}>
                Скачать расчеты
              </Button>
            </Flex>
          </div>
        )}
        </>
      )}

      {/* ======== КАРТОЧКИ РЕЗУЛЬТАТОВ ======== */}
      {hasVisibleColumns && (
        <Flex wrap justify="center">
          {visibleColumns.includes("oxygen") && (
            <OxygenResult values={values} rooms={filteredRooms} />
          )}
          {visibleColumns.includes("n2o") && (
            <N2OResult values={values} rooms={filteredRooms} />
          )}
          {visibleColumns.includes("co2") && (
            <CO2Result values={values} rooms={filteredRooms} />
          )}
          {visibleColumns.includes("air5") && (
            <AirResult values={values} rooms={filteredRooms} />
          )}
          {visibleColumns.includes("vacuum") && (
            <VacuumResult values={values} rooms={filteredRooms} />
          )}
        </Flex>
      )}
    </CalculatorPageLayout>
  );
});
