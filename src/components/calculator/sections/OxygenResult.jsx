import React, { useEffect, useState } from "react";
import { Card, Typography, Divider, Space, Tag, Table, Tooltip } from "antd";
import { gases } from "../../../data";

const { Title, Text } = Typography;

// Константы
const OXYGEN_CYLINDER_VOLUME_L = 6000;
const GAS_EXPANSION_LIQUID_TO_GAS = 860;
const KGS_MAIN_DAYS = 5;
const KGS_EMERGENCY_DAYS = 0.1;
const CYLINDERS_DAYS = 3;
const EMERGENCY_DAYS = 0.1;

function getPipeDiameter(totalLpm) {
  // Формула: 18.8 * √(часовой расход / 10)
  // Часовой расход = totalLpm * 60 / 1000 (м³/ч)
  const hourlyM3 = (totalLpm * 60) / 1000;
  const innerDiameter = 18.8 * Math.sqrt(hourlyM3 / 10);
  const innerDiameterRounded = Math.round(innerDiameter * 100) / 100;
  
  // Определяем стандартный размер трубы
  const innerWithMargin = innerDiameterRounded + 2;
  
  let outerDiameter, wallThickness;
  
  // Сравниваем с внутренними диаметрами стандартных труб
  if (innerWithMargin <= 6) { // ⌀8 (внутр. 6мм)
    outerDiameter = 8;
    wallThickness = 1;
  } else if (innerWithMargin <= 10) { // ⌀12 (внутр. 10мм)
    outerDiameter = 12;
    wallThickness = 1;
  } else if (innerWithMargin <= 13) { // ⌀15 (внутр. 13мм)
    outerDiameter = 15;
    wallThickness = 1;
  } else if (innerWithMargin <= 16) { // ⌀18 (внутр. 16мм)
    outerDiameter = 18;
    wallThickness = 1;
  } else if (innerWithMargin <= 20) { // ⌀22 (внутр. 20мм)
    outerDiameter = 22;
    wallThickness = 1;
  } else if (innerWithMargin <= 26) { // ⌀28 (внутр. 26мм)
    outerDiameter = 28;
    wallThickness = 1;
  } else if (innerWithMargin <= 32) { // ⌀35 (внутр. 32мм)
    outerDiameter = 35;
    wallThickness = 1.5;
  } else if (innerWithMargin <= 39) { // ⌀42 (внутр. 39мм)
    outerDiameter = 42;
    wallThickness = 1.5;
  } else {
    // Труба больше стандартных - показываем расчетный наружный диаметр
    outerDiameter = parseFloat((innerDiameterRounded + 2).toFixed(2));
    wallThickness = 1.5;
  }
  
  const actualInner = outerDiameter - (wallThickness * 2);
  
  return { innerDiameterRounded, outerDiameter, wallThickness, actualInner };
}

export default function OxygenResult({ values, rooms, manualTotals, manualUnits }) {
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
  const gas = gases.find((g) => g.key === "oxygen");

  const manualValue = Number(manualTotals?.oxygen || 0);
  const manualUnit = manualUnits?.oxygen || "hour";
  const hasManual = manualValue > 0;
  const hasOxygenData = hasManual || Object.values(values).some(
    (roomData) => Number(roomData?.oxygen) > 0
  );
  if (!hasOxygenData) return null;

  let totalOxygenLPerDay = 0;
  let totalPoints = 0;
  const details = [];

  if (hasManual) {
    if (manualUnit === "day") {
      totalOxygenLPerDay = manualValue;
    } else {
      totalOxygenLPerDay = manualValue * 1440;
    }
    details.push({
      room: "Ручной ввод",
      V_m: manualValue,
      N: 1,
      K: 1,
      t: manualUnit === "day" ? 24 : 24,
      V_day_room: totalOxygenLPerDay,
      manualUnit,
    });
  } else {
    rooms.forEach((room) => {
      const N = Number(values[room.key]?.oxygen || 0);
      if (N <= 0) return;

      const gasParams = room.gases?.find((g) => g.key === "oxygen");
      if (!gasParams) return;

      const V_m = Number(gasParams.flowRate ?? 0);
      const K = Number(gasParams.usageFactor ?? 1);
      const t = Number(gasParams.hoursPerDay ?? 0);

      const V_day_room = V_m * N * K * t * 60;
      totalOxygenLPerDay += V_day_room;
      totalPoints += N;

      details.push({ room: room.name || room.key, V_m, N, K, t, V_day_room });
    });
  }

  // Подробная формула
  const formulaExpression = details
    .map((d) => `(${d.V_m}×${d.N}×${d.K}×${d.t}×60)`)
    .join(" + ");

  const tooltipDetailed = hasManual ? (
    <div style={{ maxWidth: 340, lineHeight: 1.5 }}>
      <div style={{ fontSize: 12 }}>
        Введено вручную: <b>{manualValue.toLocaleString("ru-RU")} {manualUnit === "day" ? "л/сут" : "л/мин"}</b>
      </div>
      <hr style={{ margin: "6px 0", opacity: 0.3 }} />
      <div style={{ fontSize: 12 }}>
        {manualUnit === "day"
          ? <>
              <b>{manualValue.toLocaleString("ru-RU")} л/сут</b><br/>
              {manualValue.toLocaleString("ru-RU")} ÷ 1440 = <b>{(manualValue/1440).toLocaleString("ru-RU", {maximumFractionDigits: 2})} л/мин</b>
            </>
          : <>{manualValue.toLocaleString("ru-RU")} × 1440 = <b>{totalOxygenLPerDay.toLocaleString("ru-RU")} л/сут</b></>
        }
      </div>
    </div>
  ) : (
    <div style={{ maxWidth: 340, lineHeight: 1.5 }}>
      {details.map((d, i) => (
        <div key={i} style={{ fontSize: 12, display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
          <div title={d.room} style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
            {d.room}
          </div>
          <b>{Math.round(d.V_day_room).toLocaleString("ru-RU")} л/сут</b>
        </div>
      ))}
      <hr style={{ margin: "6px 0", opacity: 0.3 }} />
      <div style={{ fontSize: 12 }}>
        {formulaExpression} = <b>{totalOxygenLPerDay.toLocaleString("ru-RU")} л/сут</b>
      </div>
    </div>
  );

  // Средние значения
  let avgLpm;
  if (hasManual) {
    if (manualUnit === "day") {
      avgLpm = +(manualValue / 1440).toFixed(2);
    } else {
      avgLpm = manualValue;
    }
  } else {
    avgLpm = Math.round(totalOxygenLPerDay / 1440);
  }
  const avgM3ph = parseFloat((totalOxygenLPerDay / 1000 / 24).toFixed(2));
  const pipeData = getPipeDiameter(avgLpm);
  const pipe = pipeData.innerDiameterRounded;

  // Пересчёты для оборудования
  const dayGas_m3 = totalOxygenLPerDay / 1000;

  const kgsMain_m3 = +(
    (dayGas_m3 * KGS_MAIN_DAYS) /
    GAS_EXPANSION_LIQUID_TO_GAS
  ).toFixed(2);

  const kgsEmergency_m3 = +(
    (dayGas_m3 * KGS_EMERGENCY_DAYS) /
    GAS_EXPANSION_LIQUID_TO_GAS
  ).toFixed(2);

  const cylindersMain = Math.max(
    1,
    Math.ceil((totalOxygenLPerDay * CYLINDERS_DAYS) / OXYGEN_CYLINDER_VOLUME_L)
  );

  const cylindersEmergency = Math.max(
    1,
    Math.ceil((totalOxygenLPerDay * EMERGENCY_DAYS) / OXYGEN_CYLINDER_VOLUME_L)
  );

  // Концентратор: расчёт аварийного расхода на 0.1 суток
  const concEmergencyLpm = Math.round((totalOxygenLPerDay * EMERGENCY_DAYS) / 1440);

  // Тултипы
  const tooltipKGS = `(${dayGas_m3.toFixed(
    1
  )} м³ × ${KGS_MAIN_DAYS} сут) ÷ ${GAS_EXPANSION_LIQUID_TO_GAS} = ${kgsMain_m3} м³`;
  const tooltipCyl = `(${totalOxygenLPerDay.toLocaleString(
    "ru-RU"
  )} л/сут × ${CYLINDERS_DAYS} сут) ÷ ${OXYGEN_CYLINDER_VOLUME_L} = ${cylindersMain} шт`;
  const tooltipConc = `${totalOxygenLPerDay.toLocaleString(
    "ru-RU"
  )} ÷ 1440 = ${avgLpm} л/мин`;

  const columns = [
    { title: "Оборудование", dataIndex: "equipment", key: "equipment" },
    { title: "Основной", dataIndex: "main", key: "main", align: "center" },
    { title: "Вторичный", dataIndex: "secondary", key: "secondary", align: "center" },
    { title: "Аварийный", dataIndex: "reserve", key: "reserve", align: "center" },
  ];

  const data = [
    {
      key: "kgs",
      equipment: "Газификатор",
      main: (
        <Tooltip title={tooltipKGS}>
          <Tag color="blue">{kgsMain_m3} м³</Tag>
        </Tooltip>
      ),
      secondary: (
        <Tooltip title={tooltipKGS}>
          <Tag color="blue">{kgsMain_m3} м³</Tag>
        </Tooltip>
      ),
      reserve: (
        <Tooltip
          title={`(${dayGas_m3.toFixed(1)} × ${KGS_EMERGENCY_DAYS}) ÷ ${GAS_EXPANSION_LIQUID_TO_GAS} = ${kgsEmergency_m3} м³`}
        >
          <Tag color="blue">{kgsEmergency_m3} м³</Tag>
        </Tooltip>
      ),
    },
    {
      key: "cyl",
      equipment: "Рампа (баллоны)",
      main: (
        <Tooltip title={tooltipCyl}>
          <Tag color="purple">{cylindersMain} шт</Tag>
        </Tooltip>
      ),
      secondary: (
        <Tooltip title={tooltipCyl}>
          <Tag color="purple">{cylindersMain} шт</Tag>
        </Tooltip>
      ),
      reserve: (
        <Tooltip
          title={`(${totalOxygenLPerDay.toLocaleString("ru-RU")} × ${EMERGENCY_DAYS}) ÷ ${OXYGEN_CYLINDER_VOLUME_L} = ${cylindersEmergency} шт`}
        >
          <Tag color="purple">{cylindersEmergency} шт</Tag>
        </Tooltip>
      ),
    },
    {
      key: "conc",
      equipment: "Концентратор",
      main: (
        <Tooltip title={tooltipConc}>
          <Tag color="green">{avgLpm} л/мин</Tag>
        </Tooltip>
      ),
      secondary: (
        <Tooltip title={tooltipConc}>
          <Tag color="green">{avgLpm} л/мин</Tag>
        </Tooltip>
      ),
      reserve: (
        <Tooltip
          title={`(${totalOxygenLPerDay.toLocaleString(
            "ru-RU"
          )} × ${EMERGENCY_DAYS}) ÷ 1440 = ${concEmergencyLpm} л/мин`}
        >
          <Tag color="green">{concEmergencyLpm} л/мин</Tag>
        </Tooltip>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space align="center">
          <span style={{ color: gas.color, fontSize: 20 }}>{gas.icon}</span>
          <Title level={5} style={{ margin: 0, color: gas.color }}>
            Кислород
          </Title>
          {hasManual ? (
            <Tag color="gold">ручной ввод</Tag>
          ) : (
            <Tooltip title="Общее количество точек">
              <Tag>{totalPoints}</Tag>
            </Tooltip>
          )}
        </Space>
      }
      style={{
        marginTop: 16,
        margin: isMobile ? "10px 0" : 10,
        borderLeft: `4px solid ${gas.color}`,
        textAlign: "left",
        maxWidth: 546,
      }}
      headStyle={{
        background: `${gas.color}10`,
        borderBottom: `1px solid ${gas.color}30`,
      }}
    >
      {/* Показатели */}
      <Space style={{ marginBottom: 8, flexWrap: "wrap" }}>
        <Text>
          <b>Суточный расход:</b>{" "}
          <Tooltip title={tooltipDetailed}>
            <Tag color={gas.color}>
              {totalOxygenLPerDay.toLocaleString("ru-RU")} л/сут
            </Tag>
          </Tooltip>
        </Text>

        <Text>
          <b>Средний:</b>{" "}
          <Tooltip title={tooltipConc}>
            <Tag color="green">{avgLpm} л/мин</Tag>
          </Tooltip>
        </Text>

        <Text>
          <b>Необходимая труба:</b>{" "}
          <Tooltip title={`Внутренний диаметр: ${pipeData.innerDiameterRounded} мм\nНаружный диаметр: ${parseFloat((pipeData.innerDiameterRounded + 2).toFixed(2))} мм\nТолщина стенки: ${pipeData.wallThickness} мм`}>
            <Tag color="blue">⌀{pipeData.outerDiameter}</Tag>
          </Tooltip>
        </Text>
      </Space>

      <Divider style={{ margin: "8px 0 12px" }} />
      <Table size="small" pagination={false} columns={columns} dataSource={data} bordered />
      <Divider style={{ margin: "12px 0" }} />

      <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
        <b>Принятые допущения:</b>
        <br />• Газификатор — запас 5 сут (осн./втор.) и 0.1 сут аварийный;
        <br />• Баллонная рампа — 3 сут (осн./втор.) и аварийный запас 1 баллон (~0.1 сут);
        <br />• Концентратор — средний расход (осн./втор.), аварийный запас — 0.1 сут работы;
        <br />• 1 м³ жидкого O₂ ≈ 860 м³ газообразного;
        <br />• 1 баллон (40 л, 15 МПа) ≈ 6000 л газа.
      </Text>
    </Card>
  );
}
