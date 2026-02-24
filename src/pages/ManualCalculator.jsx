import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Typography, Flex, Button, Card, InputNumber, Empty, Segmented } from "antd";
import store from "../store/appStore";
import GasSelector from "../components/calculator/GasSelector";
import { CalculatorPageLayout, CalculatorCenteredBlock } from "../components/calculator/CalculatorLayout";
import OxygenResult from "../components/calculator/sections/OxygenResult";
import N2OResult from "../components/calculator/sections/N2OResult";
import AirResult from "../components/calculator/sections/AirResult";
import CO2Result from "../components/calculator/sections/CO2Result";
import VacuumResult from "../components/calculator/sections/VacuumResult";

const { Text } = Typography;

const LS_KEYS = {
  selectedGases: "manual:selectedGases",
  visibleColumns: "manual:visibleColumns",
  totals: "manual:totals",
};

const safeParse = (str, fallback) => {
  try {
    const v = JSON.parse(str);
    return v ?? fallback;
  } catch (_) {
    return fallback;
  }
};

export default observer(function ManualCalculator() {
  const gasKeys = new Set((store.gases || []).map((g) => g.key));

  // Всегда используем дефолтные газы из конфига, не localStorage
  const initSelectedGases = () => (store.gases || []).map((g) => g.key);

  // Всегда используем дефолтные газы из конфига, не localStorage
  const initVisibleColumns = () => (store.gases || []).map((g) => g.key);

  // Для значений можно оставить логику localStorage (чтобы не терять ввод при обновлении)
  const initTotals = () => {
    const saved = safeParse(localStorage.getItem(LS_KEYS.totals), null);
    if (!saved || typeof saved !== "object") return {};
    const pruned = {};
    Object.keys(saved).forEach((key) => {
      if (gasKeys.has(key)) pruned[key] = saved[key];
    });
    return pruned;
  };

  const [selectedGases, setSelectedGases] = useState(() => initSelectedGases());
  const [visibleColumns, setVisibleColumns] = useState(() => initVisibleColumns());
  const [manualTotals, setManualTotals] = useState(() => initTotals());
  // Единицы измерения для каждого газа: 'hour' | 'day'
  const [units, setUnits] = useState(() => {
    // по умолчанию все "hour"
    const saved = safeParse(localStorage.getItem("manual:units"), null);
    if (saved && typeof saved === "object") return saved;
    const obj = {};
    (store.gases || []).forEach(g => { obj[g.key] = "hour"; });
    return obj;
  });

  useEffect(() => {
    localStorage.setItem("manual:units", JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.selectedGases, JSON.stringify(selectedGases));
  }, [selectedGases]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.visibleColumns, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.totals, JSON.stringify(manualTotals));
  }, [manualTotals]);

  const handleToggleGas = (gasKey) => {
    setSelectedGases((prev) => {
      const isSelected = prev.includes(gasKey);
      return isSelected ? prev.filter((g) => g !== gasKey) : [...prev, gasKey];
    });
    setVisibleColumns((prev) => {
      const isVisible = prev.includes(gasKey);
      return isVisible ? prev.filter((c) => c !== gasKey) : [...prev, gasKey];
    });
  };


  const handleTotalChange = (gasKey, value) => {
    setManualTotals((prev) => ({
      ...prev,
      [gasKey]: value,
    }));
  };

  const handleUnitChange = (gasKey, unit) => {
    setUnits(prev => ({ ...prev, [gasKey]: unit }));
    // Do not reset value on unit change
  };

  const handleResetAll = () => {
    // Only clear manualTotals (input values), keep selected gases and columns as is
    setManualTotals({});
    try {
      localStorage.removeItem(LS_KEYS.totals);
    } catch (_) {}
  };

  const showEmptyState = selectedGases.length === 0;
  const hasVisibleColumns = visibleColumns.length > 0 && !showEmptyState;

  const inputGases = store.gases.filter((g) => selectedGases.includes(g.key));

  return (
    <CalculatorPageLayout>
      <CalculatorCenteredBlock>
        <GasSelector
          gases={store.gases}
          selectedGases={selectedGases}
          setSelectedGases={setSelectedGases}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          onToggleGas={handleToggleGas}
        />
      </CalculatorCenteredBlock>

      {showEmptyState ? (
        <div
          style={{
            width: "100%",
            maxWidth: 640,
            margin: "10px auto",
            padding: "40px 20px",
            border: "1px dashed #d9d9d9",
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <Empty
            description={
              <Text style={{ color: "#888", fontSize: 14 }}>
                Выберите хотя бы один газ для расчета
              </Text>
            }
          />
        </div>
      ) : (
        <>
        <CalculatorCenteredBlock maxWidth={760}>
          <Card
            
            style={{
              width: "100%",
              borderRadius: 14,
            }}
            bodyStyle={{ display: "flex", flexDirection: "column", gap: 12 }}
          >
            {inputGases.length === 0 ? (
              <Empty description="Выберите хотя бы один газ" />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 18,
                  width: "100%",
                  padding: 0,
                  border: "none"
                }}
              >
                {(() => {
                  // Определяем количество полей в строке: 2 для мобильных, 3 для десктопа
                  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 700 : false;
                  const perRow = isMobile ? 2 : 3;
                  const rows = [];
                  for (let i = 0; i < inputGases.length; i += perRow) {
                    rows.push(inputGases.slice(i, i + perRow));
                  }
                  return rows.map((row, idx) => (
                    <div
                      key={"row-" + idx}
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 18,
                        width: "100%"
                      }}
                    >
                      {row.map((gas) => (
                        <div
                          key={gas.key}
                          style={{
                            border: `1px solid ${gas.color}`,
                            borderRadius: 14,
                            padding: 16,
                            minWidth: 220,
                            boxShadow: `0 2px 10px ${gas.color}18`
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ color: gas.color, fontSize: 18 }}>{gas.icon}</span>
                            <Text strong style={{ color: gas.color }}>{gas.shortName || gas.label}</Text>
                            <Segmented
                              size="small"
                              value={units[gas.key] || "hour"}
                              onChange={val => handleUnitChange(gas.key, val)}
                              options={[{ label: "сут", value: "day" }, { label: "ср", value: "hour" }]}
                              style={{ minWidth: 70 }}
                            />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <InputNumber
                              min={0}
                              value={typeof manualTotals[gas.key] === 'number' ? manualTotals[gas.key] : 0}
                              onChange={(value) => handleTotalChange(gas.key, value)}
                              style={{ width: 120, fontWeight: 600, borderColor: gas.color, color: gas.color }}
                            />
                            <span style={{ color: gas.color, fontSize: 13, minWidth: 40 }}>
                              {units[gas.key] === "day" ? "л/сут" : "л/мин"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            )}
            <Flex justify="center" style={{ marginTop: 8 }}>
              <Button danger onClick={handleResetAll}>Очистить все</Button>
            </Flex>
          </Card>
        </CalculatorCenteredBlock>
        </>
      )}

      {showEmptyState ? null : (
        <>
          {hasVisibleColumns && (
            <Flex wrap justify="center">
              {visibleColumns.includes("oxygen") && (
                <OxygenResult values={{}} rooms={store.rooms} manualTotals={manualTotals} manualUnits={units} />
              )}
              {visibleColumns.includes("n2o") && (
                <N2OResult values={{}} rooms={store.rooms} manualTotals={manualTotals} manualUnits={units} />
              )}
              {visibleColumns.includes("co2") && (
                <CO2Result values={{}} rooms={store.rooms} manualTotals={manualTotals} manualUnits={units} />
              )}
              {visibleColumns.includes("air5") || visibleColumns.includes("air8") || visibleColumns.includes("agss") ? (
                <AirResult values={{}} rooms={store.rooms} manualTotals={manualTotals} manualUnits={units} />
              ) : null}
              {visibleColumns.includes("vacuum") && (
                <VacuumResult values={{}} rooms={store.rooms} manualTotals={manualTotals} manualUnits={units} />
              )}
            </Flex>
          )}
        </>
      )}
    </CalculatorPageLayout>
  );
});
