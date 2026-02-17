import React, { useState, useCallback, useEffect } from "react";
import { observer } from "mobx-react-lite";
import store from "../store/appStore";
import { Flex, Typography, Empty, Button, Alert } from "antd";
import { DownloadOutlined, WarningOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import GasSelector from "../components/calculator/GasSelector";
import CalculatorTable from "../components/calculator/CalculatorTable";
import RoomSelector from "../components/calculator/RoomSelector";
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

  // ======== EXPORT: Build HTML for legacy .xls (kept as fallback) ========
  const buildExcelHtml = () => {
    // Helpers
    const fmt = (n, d = 2) => (typeof n === "number" ? Number.isInteger(n) ? n : Number(n.toFixed(d)) : n);
    const hasPoints = (key) => filteredRooms.some((room) => Number(values[room.key]?.[key]) > 0);

    // Helper for pipe diameter calculation
    const getPipeDiameter = (totalLpm) => {
      const hourlyM3 = (totalLpm * 60) / 1000;
      const innerDiameter = 18.8 * Math.sqrt(hourlyM3 / 10);
      const innerDiameterRounded = Math.round(innerDiameter * 100) / 100;
      const innerWithMargin = innerDiameterRounded + 2;
      
      let outerDiameter, wallThickness;
      if (innerWithMargin <= 6) {
        outerDiameter = 8; wallThickness = 1;
      } else if (innerWithMargin <= 10) {
        outerDiameter = 12; wallThickness = 1;
      } else if (innerWithMargin <= 13) {
        outerDiameter = 15; wallThickness = 1;
      } else if (innerWithMargin <= 16) {
        outerDiameter = 18; wallThickness = 1;
      } else if (innerWithMargin <= 20) {
        outerDiameter = 22; wallThickness = 1;
      } else if (innerWithMargin <= 26) {
        outerDiameter = 28; wallThickness = 1;
      } else if (innerWithMargin <= 32) {
        outerDiameter = 35; wallThickness = 1.5;
      } else if (innerWithMargin <= 39) {
        outerDiameter = 42; wallThickness = 1.5;
      } else {
        outerDiameter = parseFloat((innerDiameterRounded + 2).toFixed(2));
        wallThickness = 1.5;
      }
      return { innerDiameterRounded, outerDiameter, wallThickness };
    };

    // Compute Oxygen
    const OXYGEN_CYLINDER_VOLUME_L = 6000;
    const GAS_EXPANSION_LIQUID_TO_GAS = 860;
    const KGS_MAIN_DAYS = 5;
    const KGS_EMERGENCY_DAYS = 0.1;
    const CYLINDERS_DAYS = 3;
    const EMERGENCY_DAYS = 0.1;

    let oxy_totalLPerDay = 0, oxy_totalPoints = 0, oxy_roomsCount = 0;
    filteredRooms.forEach((room) => {
      const N = Number(values[room.key]?.oxygen || 0);
      if (N <= 0) return;
      oxy_roomsCount++;
      oxy_totalPoints += N;
      const gp = room.gases?.find((g) => g.key === "oxygen");
      if (!gp) return;
      const V_m = Number(gp.flowRate ?? 0);
      const K = Number(gp.usageFactor ?? 1);
      const t = Number(gp.hoursPerDay ?? 0);
      oxy_totalLPerDay += V_m * N * K * t * 60;
    });
    const oxy_day_m3 = oxy_totalLPerDay / 1000;
    const oxy_avgLpm = Math.round(oxy_totalLPerDay / 1440);
    const oxy_kgsMain_m3 = (oxy_day_m3 * KGS_MAIN_DAYS) / GAS_EXPANSION_LIQUID_TO_GAS;
    const oxy_kgsEmergency_m3 = (oxy_day_m3 * KGS_EMERGENCY_DAYS) / GAS_EXPANSION_LIQUID_TO_GAS;
    const oxy_cylMain = Math.max(1, Math.ceil((oxy_totalLPerDay * CYLINDERS_DAYS) / OXYGEN_CYLINDER_VOLUME_L));
    const oxy_cylEmerg = Math.max(1, Math.ceil((oxy_totalLPerDay * EMERGENCY_DAYS) / OXYGEN_CYLINDER_VOLUME_L));
    const oxy_concEmergLpm = Math.round((oxy_totalLPerDay * EMERGENCY_DAYS) / 1440);
    const oxy_pipe = oxy_avgLpm > 0 ? getPipeDiameter(oxy_avgLpm) : null;

    // Compute Air/AGSS
    let air5_lpm = 0, air8_lpm = 0, agss_m3ph = 0, air_has = false, air_roomsCount = 0, air_totalPoints = 0;
    filteredRooms.forEach((room) => {
      const N5 = Number(values[room.key]?.air5 || 0);
      const N8 = Number(values[room.key]?.air8 || 0);
      const Nagss = Number(values[room.key]?.agss || 0);
      if (N5 > 0 || N8 > 0 || Nagss > 0) {
        air_roomsCount++;
        air_totalPoints += N5 + N8 + Nagss;
      }
      if (N5 > 0) {
        const gp5 = room.gases?.find((g) => g.key === "air5");
        if (gp5) {
          const V_m = Number(gp5.flowRate ?? 0);
          const K = Number(gp5.usageFactor ?? 1);
          air5_lpm += V_m * N5 * K;
          air_has = true;
        }
      }
      if (N8 > 0) {
        const gp8 = room.gases?.find((g) => g.key === "air8");
        if (gp8) {
          const K = Number(gp8.usageFactor ?? 1);
          air8_lpm += 350 * N8 * K;
          air_has = true;
        }
      }
      if (Nagss > 0) {
        agss_m3ph += Nagss * 3;
        air_has = true;
      }
    });
    const air_total_m3ph = ((air5_lpm + air8_lpm) * 60) / 1000;
    const air_with_agss_m3ph = air_total_m3ph + agss_m3ph;
    const air_total_lpm = air5_lpm + air8_lpm;
    const agss_lpm = (agss_m3ph * 1000) / 60;
    const air_with_agss_lpm = air_total_lpm + agss_lpm;
    const air_pipe = air_with_agss_lpm > 0 ? getPipeDiameter(air_with_agss_lpm) : null;

    // Compute CO2
    const CO2_CYLINDER_VOLUME_L = 6000;
    let co2_totalLPerDay = 0, co2_roomsCount = 0, co2_totalPoints = 0;
    filteredRooms.forEach((room) => {
      const N = Number(values[room.key]?.co2 || 0);
      if (N <= 0) return;
      co2_roomsCount++;
      co2_totalPoints += N;
      const gp = room.gases?.find((g) => g.key === "co2");
      if (!gp) return;
      const V_m = Number(gp.flowRate ?? 0);
      const K = Number(gp.usageFactor ?? 1);
      const t = Number(gp.hoursPerDay ?? 0);
      co2_totalLPerDay += V_m * N * K * t * 60;
    });
    const co2_cylDay = Math.ceil(co2_totalLPerDay / CO2_CYLINDER_VOLUME_L) || 0;
    const co2_avgLpm = co2_totalLPerDay > 0 ? Math.round(co2_totalLPerDay / 1440) : 0;
    const co2_pipe = co2_avgLpm > 0 ? getPipeDiameter(co2_avgLpm) : null;

    // Compute N2O
    const N2O_CYLINDER_VOLUME_L = 3000;
    let n2o_totalLPerDay = 0, n2o_roomsCount = 0, n2o_totalPoints = 0;
    filteredRooms.forEach((room) => {
      const N = Number(values[room.key]?.n2o || 0);
      if (N <= 0) return;
      n2o_roomsCount++;
      n2o_totalPoints += N;
      const gp = room.gases?.find((g) => g.key === "n2o");
      if (!gp) return;
      const V_m = Number(gp.flowRate ?? 0);
      const K = Number(gp.usageFactor ?? 1);
      const t = Number(gp.hoursPerDay ?? 0);
      n2o_totalLPerDay += V_m * N * K * t * 60;
    });
    const n2o_cylDay = Math.ceil(n2o_totalLPerDay / N2O_CYLINDER_VOLUME_L) || 0;
    const n2o_avgLpm = n2o_totalLPerDay > 0 ? Math.round(n2o_totalLPerDay / 1440) : 0;
    const n2o_pipe = n2o_avgLpm > 0 ? getPipeDiameter(n2o_avgLpm) : null;

    // Compute Vacuum
    let vac_totalLpm = 0, vac_roomsCount = 0, vac_totalPoints = 0;
    filteredRooms.forEach((room) => {
      const N = Number(values[room.key]?.vacuum || 0);
      if (N <= 0) return;
      vac_roomsCount++;
      vac_totalPoints += N;
      const gp = room.gases?.find((g) => g.key === "vacuum");
      if (!gp) return;
      const V_m = Number(gp.flowRate ?? 0);
      const K = Number(gp.usageFactor ?? 0.4);
      vac_totalLpm += V_m * N * K;
    });
    const vac_totalM3ph = (vac_totalLpm / 1000) * 60;
    const vac_pipe = vac_totalLpm > 0 ? getPipeDiameter(vac_totalLpm) : null;

    // Build HTML sections
    const sections = [];

    // Oxygen section if present
    if (hasPoints("oxygen")) {
      sections.push(`
        <div style="margin-bottom: 80px;">
          <h3 style="margin-bottom: 10px;">Кислород</h3>
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="vertical-align: top; padding-right: 20px;">
                <table border="1" cellspacing="0" cellpadding="4">
                  <tr><td><b>Количество помещений</b></td><td>${oxy_roomsCount}</td></tr>
                  <tr><td><b>Количество точек</b></td><td>${oxy_totalPoints}</td></tr>
                  <tr><td><b>Суточный расход</b></td><td>${fmt(oxy_totalLPerDay)} л/сут</td></tr>
                  <tr><td><b>Средний расход</b></td><td>${oxy_avgLpm} л/мин</td></tr>
                  ${oxy_pipe ? `<tr><td><b>Необходимая труба</b></td><td>⌀${oxy_pipe.outerDiameter} мм (внутр. ${oxy_pipe.innerDiameterRounded} мм, стенка ${oxy_pipe.wallThickness} мм)</td></tr>` : ''}
                </table>
              </td>
              <td style="vertical-align: top;">
                <table border="1" cellspacing="0" cellpadding="4">
                  <tr><th>Оборудование</th><th>Основной</th><th>Вторичный</th><th>Аварийный</th></tr>
                  <tr><td>Газификатор</td><td>${fmt(oxy_kgsMain_m3)} м³</td><td>${fmt(oxy_kgsMain_m3)} м³</td><td>${fmt(oxy_kgsEmergency_m3)} м³</td></tr>
                  <tr><td>Рампа (баллоны)</td><td>${oxy_cylMain} шт</td><td>${oxy_cylMain} шт</td><td>${oxy_cylEmerg} шт</td></tr>
                  <tr><td>Концентратор</td><td>${oxy_avgLpm} л/мин</td><td>${oxy_avgLpm} л/мин</td><td>${oxy_concEmergLpm} л/мин</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `);
    }

    // Air/AGSS section if present
    if (air_has && (hasPoints("air5") || hasPoints("air8") || hasPoints("agss"))) {
      sections.push(`
        <div style="margin-bottom: 80px;">
          <h3 style="margin-bottom: 10px;">Воздух / AGSS</h3>
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="vertical-align: top; padding-right: 20px;">
                <table border="1" cellspacing="0" cellpadding="4">
                  <tr><td><b>Количество помещений</b></td><td>${air_roomsCount}</td></tr>
                  <tr><td><b>Количество точек</b></td><td>${air_totalPoints}</td></tr>
                  <tr><td><b>Средний расход (с AGSS)</b></td><td>${fmt(air_with_agss_lpm)} л/мин</td></tr>
                  ${air_pipe ? `<tr><td><b>Необходимая труба</b></td><td>⌀${air_pipe.outerDiameter} мм (внутр. ${air_pipe.innerDiameterRounded} мм, стенка ${air_pipe.wallThickness} мм)</td></tr>` : ''}
                </table>
              </td>
              <td style="vertical-align: top;">
                <table border="1" cellspacing="0" cellpadding="4">
                  <tr><th>Оборудование</th><th>Основной источник</th><th>Вторичный источник</th><th>Резервный источник</th></tr>
                  <tr><td>Компрессор с учётом AGSS</td><td>${fmt(air_with_agss_lpm)} л/мин</td><td>${fmt(air_with_agss_lpm)} л/мин</td><td>${fmt(air_with_agss_lpm)} л/мин</td></tr>
                  <tr><td>Станция отвода AGSS</td><td>${fmt(agss_lpm)} л/мин</td><td>${fmt(agss_lpm)} л/мин</td><td>${fmt(agss_lpm)} л/мин</td></tr>
                  <tr><td>Компрессор без учёта AGSS</td><td>${fmt(air_total_lpm)} л/мин</td><td>${fmt(air_total_lpm)} л/мин</td><td>${fmt(air_total_lpm)} л/мин</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `);
    }

    // CO2 section if present
    if (hasPoints("co2")) {
      sections.push(`
        <div style="margin-bottom: 80px;">
          <h3 style="margin-bottom: 10px;">Углекислый газ (CO₂)</h3>
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="vertical-align: top; padding-right: 20px;">
                <table border="1" cellspacing="0" cellpadding="4">
                  <tr><td><b>Количество помещений</b></td><td>${co2_roomsCount}</td></tr>
                  <tr><td><b>Количество точек</b></td><td>${co2_totalPoints}</td></tr>
                  <tr><td><b>Суточный расход</b></td><td>${fmt(co2_totalLPerDay)} л/сут</td></tr>
                  <tr><td><b>Средний расход</b></td><td>${co2_avgLpm} л/мин</td></tr>
                  ${co2_pipe ? `<tr><td><b>Необходимая труба</b></td><td>⌀${co2_pipe.outerDiameter} мм (внутр. ${co2_pipe.innerDiameterRounded} мм, стенка ${co2_pipe.wallThickness} мм)</td></tr>` : ''}
                </table>
              </td>
              <td style="vertical-align: top;">
                <table border="1" cellspacing="0" cellpadding="4">
                  <tr><th>Оборудование</th><th>Основной источник</th><th>Вторичный источник</th></tr>
                  <tr><td>Рампа (баллоны)</td><td>${co2_cylDay} шт</td><td>${co2_cylDay} шт</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `);
    }

    // N2O section if present
    if (hasPoints("n2o")) {
      sections.push(`
        <div style="margin-bottom: 80px;">
          <h3 style="margin-bottom: 10px;">Закись азота (N₂O)</h3>
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="vertical-align: top; padding-right: 20px;">
                <table border="1" cellspacing="0" cellpadding="4">
                  <tr><td><b>Количество помещений</b></td><td>${n2o_roomsCount}</td></tr>
                  <tr><td><b>Количество точек</b></td><td>${n2o_totalPoints}</td></tr>
                  <tr><td><b>Суточный расход</b></td><td>${fmt(n2o_totalLPerDay)} л/сут</td></tr>
                  <tr><td><b>Средний расход</b></td><td>${n2o_avgLpm} л/мин</td></tr>
                  ${n2o_pipe ? `<tr><td><b>Необходимая труба</b></td><td>⌀${n2o_pipe.outerDiameter} мм (внутр. ${n2o_pipe.innerDiameterRounded} мм, стенка ${n2o_pipe.wallThickness} мм)</td></tr>` : ''}
                </table>
              </td>
              <td style="vertical-align: top;">
                <table border="1" cellspacing="0" cellpadding="4">
                  <tr><th>Оборудование</th><th>Основной источник</th><th>Вторичный источник</th></tr>
                  <tr><td>Рампа (баллоны)</td><td>${n2o_cylDay} шт</td><td>${n2o_cylDay} шт</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `);
    }

    // Vacuum section if present
    if (hasPoints("vacuum")) {
      sections.push(`
        <div style="margin-bottom: 80px;">
          <h3 style="margin-bottom: 10px;">Вакуум</h3>
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="vertical-align: top; padding-right: 20px;">
                <table border="1" cellspacing="0" cellpadding="4">
                  <tr><td><b>Количество помещений</b></td><td>${vac_roomsCount}</td></tr>
                  <tr><td><b>Количество точек</b></td><td>${vac_totalPoints}</td></tr>
                  <tr><td><b>Общий расход</b></td><td>${fmt(Math.round(vac_totalLpm))} л/мин (${fmt(vac_totalM3ph)} м³/ч)</td></tr>
                  ${vac_pipe ? `<tr><td><b>Необходимая труба</b></td><td>⌀${vac_pipe.outerDiameter} мм (внутр. ${vac_pipe.innerDiameterRounded} мм, стенка ${vac_pipe.wallThickness} мм)</td></tr>` : ''}
                </table>
              </td>
              <td style="vertical-align: top;">
                <table border="1" cellspacing="0" cellpadding="4">
                  <tr><th>Оборудование</th><th>Основной источник</th><th>Вторичный источник</th><th>Резервный источник</th></tr>
                  <tr><td>Компрессор</td><td>${Math.round(vac_totalLpm)} л/мин</td><td>${Math.round(vac_totalLpm)} л/мин</td><td>${Math.round(vac_totalLpm)} л/мин</td></tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `);
    }

    const content = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>${sections.join("")}</body></html>`;
    return content;
  };

  // ======== EXPORT ALL RESULTS TO TRUE XLSX ========
  const buildXlsxAoA = () => {
    const aoa = [];
    const pushBlank = () => aoa.push([""]);

    const fmt = (n, d = 2) => (typeof n === "number" ? Number.isInteger(n) ? n : Number(n.toFixed(d)) : n);
    const hasPoints = (key) => filteredRooms.some((room) => Number(values[room.key]?.[key]) > 0);

    // Helper for pipe diameter calculation
    const getPipeDiameter = (totalLpm) => {
      const hourlyM3 = (totalLpm * 60) / 1000;
      const innerDiameter = 18.8 * Math.sqrt(hourlyM3 / 10);
      const innerDiameterRounded = Math.round(innerDiameter * 100) / 100;
      const innerWithMargin = innerDiameterRounded + 2;
      
      let outerDiameter, wallThickness;
      if (innerWithMargin <= 6) {
        outerDiameter = 8; wallThickness = 1;
      } else if (innerWithMargin <= 10) {
        outerDiameter = 12; wallThickness = 1;
      } else if (innerWithMargin <= 13) {
        outerDiameter = 15; wallThickness = 1;
      } else if (innerWithMargin <= 16) {
        outerDiameter = 18; wallThickness = 1;
      } else if (innerWithMargin <= 20) {
        outerDiameter = 22; wallThickness = 1;
      } else if (innerWithMargin <= 26) {
        outerDiameter = 28; wallThickness = 1;
      } else if (innerWithMargin <= 32) {
        outerDiameter = 35; wallThickness = 1.5;
      } else if (innerWithMargin <= 39) {
        outerDiameter = 42; wallThickness = 1.5;
      } else {
        outerDiameter = parseFloat((innerDiameterRounded + 2).toFixed(2));
        wallThickness = 1.5;
      }
      return { innerDiameterRounded, outerDiameter, wallThickness };
    };

    // Oxygen
    const OXYGEN_CYLINDER_VOLUME_L = 6000;
    const GAS_EXPANSION_LIQUID_TO_GAS = 860;
    const KGS_MAIN_DAYS = 5;
    const KGS_EMERGENCY_DAYS = 0.1;
    const CYLINDERS_DAYS = 3;
    const EMERGENCY_DAYS = 0.1;

    let oxy_totalLPerDay = 0, oxy_totalPoints = 0, oxy_roomsCount = 0;
    filteredRooms.forEach((room) => {
      const N = Number(values[room.key]?.oxygen || 0);
      if (N <= 0) return;
      oxy_roomsCount++;
      oxy_totalPoints += N;
      const gp = room.gases?.find((g) => g.key === "oxygen");
      if (!gp) return;
      const V_m = Number(gp.flowRate ?? 0);
      const K = Number(gp.usageFactor ?? 1);
      const t = Number(gp.hoursPerDay ?? 0);
      oxy_totalLPerDay += V_m * N * K * t * 60;
    });
    const oxy_day_m3 = oxy_totalLPerDay / 1000;
    const oxy_avgLpm = Math.round(oxy_totalLPerDay / 1440);
    const oxy_kgsMain_m3 = (oxy_day_m3 * KGS_MAIN_DAYS) / GAS_EXPANSION_LIQUID_TO_GAS;
    const oxy_kgsEmergency_m3 = (oxy_day_m3 * KGS_EMERGENCY_DAYS) / GAS_EXPANSION_LIQUID_TO_GAS;
    const oxy_cylMain = Math.max(1, Math.ceil((oxy_totalLPerDay * CYLINDERS_DAYS) / OXYGEN_CYLINDER_VOLUME_L));
    const oxy_cylEmerg = Math.max(1, Math.ceil((oxy_totalLPerDay * EMERGENCY_DAYS) / OXYGEN_CYLINDER_VOLUME_L));
    const oxy_concEmergLpm = Math.round((oxy_totalLPerDay * EMERGENCY_DAYS) / 1440);
    const oxy_pipe = oxy_avgLpm > 0 ? getPipeDiameter(oxy_avgLpm) : null;

    if (hasPoints("oxygen")) {
      aoa.push(["Кислород"]);
      aoa.push(["Количество помещений", oxy_roomsCount]);
      aoa.push(["Количество точек", oxy_totalPoints]);
      aoa.push(["Суточный расход", `${fmt(oxy_totalLPerDay)} л/сут`]);
      aoa.push(["Средний расход", `${oxy_avgLpm} л/мин`]);
      if (oxy_pipe) {
        aoa.push(["Необходимая труба", `⌀${oxy_pipe.outerDiameter} мм (внутр. ${oxy_pipe.innerDiameterRounded} мм, стенка ${oxy_pipe.wallThickness} мм)`]);
      }
      pushBlank();
      aoa.push(["Оборудование", "Основной", "Вторичный", "Аварийный"]);
      aoa.push(["Газификатор", `${fmt(oxy_kgsMain_m3)} м³`, `${fmt(oxy_kgsMain_m3)} м³`, `${fmt(oxy_kgsEmergency_m3)} м³`]);
      aoa.push(["Рампа (баллоны)", `${oxy_cylMain} шт`, `${oxy_cylMain} шт`, `${oxy_cylEmerg} шт`]);
      aoa.push(["Концентратор", `${oxy_avgLpm} л/мин`, `${oxy_avgLpm} л/мин`, `${oxy_concEmergLpm} л/мин`]);
      pushBlank();
    }

    // Air / AGSS
    let air5_lpm = 0, air8_lpm = 0, agss_m3ph = 0, air_has = false, air_roomsCount = 0, air_totalPoints = 0;
    filteredRooms.forEach((room) => {
      const N5 = Number(values[room.key]?.air5 || 0);
      const N8 = Number(values[room.key]?.air8 || 0);
      const Nagss = Number(values[room.key]?.agss || 0);
      if (N5 > 0 || N8 > 0 || Nagss > 0) {
        air_roomsCount++;
        air_totalPoints += N5 + N8 + Nagss;
      }
      if (N5 > 0) {
        const gp5 = room.gases?.find((g) => g.key === "air5");
        if (gp5) {
          const V_m = Number(gp5.flowRate ?? 0);
          const K = Number(gp5.usageFactor ?? 1);
          air5_lpm += V_m * N5 * K;
          air_has = true;
        }
      }
      if (N8 > 0) {
        const gp8 = room.gases?.find((g) => g.key === "air8");
        if (gp8) {
          const K = Number(gp8.usageFactor ?? 1);
          air8_lpm += 350 * N8 * K;
          air_has = true;
        }
      }
      if (Nagss > 0) {
        agss_m3ph += Nagss * 3;
        air_has = true;
      }
    });
    const air_total_m3ph = ((air5_lpm + air8_lpm) * 60) / 1000;
    const air_with_agss_m3ph = air_total_m3ph + agss_m3ph;
    // Convert to l/min for export
    const air_total_lpm = air5_lpm + air8_lpm;
    const agss_lpm = (agss_m3ph * 1000) / 60;
    const air_with_agss_lpm = air_total_lpm + agss_lpm;
    const air_pipe = air_with_agss_lpm > 0 ? getPipeDiameter(air_with_agss_lpm) : null;

    if (air_has && (hasPoints("air5") || hasPoints("air8") || hasPoints("agss"))) {
      aoa.push(["Воздух / AGSS"]);
      aoa.push(["Количество помещений", air_roomsCount]);
      aoa.push(["Количество точек", air_totalPoints]);
      aoa.push(["Средний расход (с AGSS)", `${fmt(air_with_agss_lpm)} л/мин`]);
      if (air_pipe) {
        aoa.push(["Необходимая труба", `⌀${air_pipe.outerDiameter} мм (внутр. ${air_pipe.innerDiameterRounded} мм, стенка ${air_pipe.wallThickness} мм)`]);
      }
      pushBlank();
      aoa.push(["Оборудование", "Основной источник", "Вторичный источник", "Резервный источник"]);
      aoa.push(["Компрессор с учётом AGSS", `${fmt(air_with_agss_lpm)} л/мин`, `${fmt(air_with_agss_lpm)} л/мин`, `${fmt(air_with_agss_lpm)} л/мин`]);
      aoa.push(["Станция отвода AGSS", `${fmt(agss_lpm)} л/мин`, `${fmt(agss_lpm)} л/мин`, `${fmt(agss_lpm)} л/мин`]);
      aoa.push(["Компрессор без учёта AGSS", `${fmt(air_total_lpm)} л/мин`, `${fmt(air_total_lpm)} л/мин`, `${fmt(air_total_lpm)} л/мин`]);
      pushBlank();
    }

    // CO2
    const CO2_CYLINDER_VOLUME_L = 6000;
    let co2_totalLPerDay = 0, co2_roomsCount = 0, co2_totalPoints = 0;
    filteredRooms.forEach((room) => {
      const N = Number(values[room.key]?.co2 || 0);
      if (N <= 0) return;
      co2_roomsCount++;
      co2_totalPoints += N;
      const gp = room.gases?.find((g) => g.key === "co2");
      if (!gp) return;
      const V_m = Number(gp.flowRate ?? 0);
      const K = Number(gp.usageFactor ?? 1);
      const t = Number(gp.hoursPerDay ?? 0);
      co2_totalLPerDay += V_m * N * K * t * 60;
    });
    const co2_cylDay = Math.ceil(co2_totalLPerDay / CO2_CYLINDER_VOLUME_L) || 0;
    const co2_avgLpm = co2_totalLPerDay > 0 ? Math.round(co2_totalLPerDay / 1440) : 0;
    const co2_pipe = co2_avgLpm > 0 ? getPipeDiameter(co2_avgLpm) : null;

    if (hasPoints("co2")) {
      aoa.push(["Углекислый газ (CO₂)"]);
      aoa.push(["Количество помещений", co2_roomsCount]);
      aoa.push(["Количество точек", co2_totalPoints]);
      aoa.push(["Суточный расход", `${fmt(co2_totalLPerDay)} л/сут`]);
      aoa.push(["Средний расход", `${co2_avgLpm} л/мин`]);
      if (co2_pipe) {
        aoa.push(["Необходимая труба", `⌀${co2_pipe.outerDiameter} мм (внутр. ${co2_pipe.innerDiameterRounded} мм, стенка ${co2_pipe.wallThickness} мм)`]);
      }
      pushBlank();
      aoa.push(["Оборудование", "Основной источник", "Вторичный источник"]);
      aoa.push(["Рампа (баллоны)", `${co2_cylDay} шт`, `${co2_cylDay} шт`]);
      pushBlank();
    }

    // N2O
    const N2O_CYLINDER_VOLUME_L = 3000;
    let n2o_totalLPerDay = 0, n2o_roomsCount = 0, n2o_totalPoints = 0;
    filteredRooms.forEach((room) => {
      const N = Number(values[room.key]?.n2o || 0);
      if (N <= 0) return;
      n2o_roomsCount++;
      n2o_totalPoints += N;
      const gp = room.gases?.find((g) => g.key === "n2o");
      if (!gp) return;
      const V_m = Number(gp.flowRate ?? 0);
      const K = Number(gp.usageFactor ?? 1);
      const t = Number(gp.hoursPerDay ?? 0);
      n2o_totalLPerDay += V_m * N * K * t * 60;
    });
    const n2o_cylDay = Math.ceil(n2o_totalLPerDay / N2O_CYLINDER_VOLUME_L) || 0;
    const n2o_avgLpm = n2o_totalLPerDay > 0 ? Math.round(n2o_totalLPerDay / 1440) : 0;
    const n2o_pipe = n2o_avgLpm > 0 ? getPipeDiameter(n2o_avgLpm) : null;

    if (hasPoints("n2o")) {
      aoa.push(["Закись азота (N₂O)"]);
      aoa.push(["Количество помещений", n2o_roomsCount]);
      aoa.push(["Количество точек", n2o_totalPoints]);
      aoa.push(["Суточный расход", `${fmt(n2o_totalLPerDay)} л/сут`]);
      aoa.push(["Средний расход", `${n2o_avgLpm} л/мин`]);
      if (n2o_pipe) {
        aoa.push(["Необходимая труба", `⌀${n2o_pipe.outerDiameter} мм (внутр. ${n2o_pipe.innerDiameterRounded} мм, стенка ${n2o_pipe.wallThickness} мм)`]);
      }
      pushBlank();
      aoa.push(["Оборудование", "Основной источник", "Вторичный источник"]);
      aoa.push(["Рампа (баллоны)", `${n2o_cylDay} шт`, `${n2o_cylDay} шт`]);
      pushBlank();
    }

    // Vacuum
    let vac_totalLpm = 0, vac_roomsCount = 0, vac_totalPoints = 0;
    filteredRooms.forEach((room) => {
      const N = Number(values[room.key]?.vacuum || 0);
      if (N <= 0) return;
      vac_roomsCount++;
      vac_totalPoints += N;
      const gp = room.gases?.find((g) => g.key === "vacuum");
      if (!gp) return;
      const V_m = Number(gp.flowRate ?? 0);
      const K = Number(gp.usageFactor ?? 0.4);
      vac_totalLpm += V_m * N * K;
    });
    const vac_totalM3ph = (vac_totalLpm / 1000) * 60;
    const vac_pipe = vac_totalLpm > 0 ? getPipeDiameter(vac_totalLpm) : null;

    if (hasPoints("vacuum")) {
      aoa.push(["Вакуум"]);
      aoa.push(["Количество помещений", vac_roomsCount]);
      aoa.push(["Количество точек", vac_totalPoints]);
      aoa.push(["Общий расход", `${fmt(Math.round(vac_totalLpm))} л/мин (${fmt(vac_totalM3ph)} м³/ч)`]);
      if (vac_pipe) {
        aoa.push(["Необходимая труба", `⌀${vac_pipe.outerDiameter} мм (внутр. ${vac_pipe.innerDiameterRounded} мм, стенка ${vac_pipe.wallThickness} мм)`]);
      }
      pushBlank();
      aoa.push(["Оборудование", "Основной источник", "Вторичный источник", "Резервный источник"]);
      aoa.push(["Компрессор", `${fmt(Math.round(vac_totalLpm))} л/мин`, `${fmt(Math.round(vac_totalLpm))} л/мин`, `${fmt(Math.round(vac_totalLpm))} л/мин`]);
      pushBlank();
    }

    if (aoa.length === 0) {
      aoa.push(["Нет данных для экспорта"]);
    }

    return aoa;
  };

  const handleExportAll = () => {
    try {
      const aoa = buildXlsxAoA();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      // Optional: best-effort column widths
      const maxCols = Math.max(...aoa.map((r) => r.length));
      ws['!cols'] = new Array(maxCols).fill({ wch: 26 });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Расчеты");
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `Расчеты — ${date}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback to HTML .xls if XLSX fails for any reason
      const html = buildExcelHtml();
      const blob = new Blob(["\ufeff" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `Расчеты — ${date}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* ======== ВЫБОР ГАЗОВ ======== */}
      <div style={{ width: "100%", maxWidth: 630, margin: "0 auto" }}>
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
      </div>

      {/* ======== ВЫБОР ПОМЕЩЕНИЙ ======== */}
      <div style={{ width: "100%", maxWidth: 630, margin: "0 auto" }}>
        <RoomSelector
          rooms={store.rooms}
          selectedRooms={selectedRooms}
          onChange={handleSelectRooms}
        />
      </div>

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
              <Button icon={<DownloadOutlined />} onClick={handleExportAll}>
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
    </div>
  );
});
