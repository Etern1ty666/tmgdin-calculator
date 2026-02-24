import React, { useEffect, useState } from "react";
import { Card, Typography, Space, Tag, Table, Tooltip, Divider } from "antd";
import { gases } from "../../../data";

const { Title, Text } = Typography;

function getPipeDiameter(totalLpm) {
  const hourlyM3 = (totalLpm * 60) / 1000;
  const innerDiameter = 18.8 * Math.sqrt(hourlyM3 / 10);
  const innerDiameterRounded = Math.round(innerDiameter * 100) / 100;
  
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

export default function VacuumResult({ values, rooms, manualTotals, manualUnits }) {
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
  const gas = gases.find((g) => g.key === "vacuum");

  // Проверяем, есть ли данные по вакууму
  const manualValue = Number(manualTotals?.vacuum || 0);
  const manualUnit = manualUnits?.vacuum || "hour";
  const hasManual = manualValue > 0;
  const hasData = hasManual || Object.values(values).some(
    (roomData) => Number(roomData?.vacuum) > 0
  );
  if (!hasData) return null;

  let totalLpm = 0; // общий расход в л/мин
  let totalPoints = 0;
  const details = [];

  if (hasManual) {
    if (manualUnit === "day") {
      totalLpm = +(manualValue / 1440).toFixed(2);
    } else {
      totalLpm = manualValue;
    }
    details.push({
      room: "Ручной ввод",
      V_m: manualValue,
      N: 1,
      K: 1,
      V: totalLpm,
      manualUnit,
    });
  } else {
    rooms.forEach((room) => {
      const N = Number(values[room.key]?.vacuum || 0);
      if (N <= 0) return;

      const gp = room.gases?.find((g) => g.key === "vacuum");
      if (!gp) return;

      const V_m = Number(gp.flowRate ?? 0); // номинальный расход на точку, л/мин
      const K = Number(gp.usageFactor ?? 0.4); // коэффициент использования (по СП — 0.4)
      const V = V_m * N * K;

      totalLpm += V;
      totalPoints += N;

      details.push({ room: room.name || room.key, V_m, N, K, V });
    });
  }

  // Перевод в м³/ч
  const totalM3ph = (totalLpm / 1000) * 60;
  const pipeData = getPipeDiameter(totalLpm);
  const pipe = pipeData.innerDiameterRounded;

  // тултип с формулами
  const tooltipDetails = hasManual ? (
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
          : <>{manualValue.toLocaleString("ru-RU")} л/мин</>}
      </div>
      <hr style={{ margin: "6px 0", opacity: 0.3 }} />
      <div style={{ fontSize: 12 }}>
        Σ&nbsp;=&nbsp;<b>{Math.round(totalLpm)} л/мин</b> ={" "}
        <b>{totalM3ph.toFixed(2)} м³/ч</b>
      </div>
    </div>
  ) : (
    <div style={{ maxWidth: 340, lineHeight: 1.5 }}>
      {details.map((d, i) => (
        <div
          key={i}
          style={{
            fontSize: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 2,
          }}
        >
          <span title={d.room}>
            {d.room}: ({d.V_m}×{d.N}×{d.K})
          </span>
          <b>{Math.round(d.V)} л/мин</b>
        </div>
      ))}
      <hr style={{ margin: "6px 0", opacity: 0.3 }} />
      <div style={{ fontSize: 12 }}>
        Σ&nbsp;=&nbsp;<b>{Math.round(totalLpm)} л/мин</b> ={" "}
        <b>{totalM3ph.toFixed(2)} м³/ч</b>
      </div>
    </div>
  );

  // таблица
  const columns = [
    { title: "Оборудование", dataIndex: "equipment", key: "equipment" },
    {
      title: "Основной источник",
      dataIndex: "main",
      key: "main",
      align: "center",
    },
    {
      title: "Вторичный источник",
      dataIndex: "secondary",
      key: "secondary",
      align: "center",
    },
    {
      title: "Резервный источник",
      dataIndex: "reserve",
      key: "reserve",
      align: "center",
    },
  ];

  const data = [
    {
      key: "compressor",
      equipment: "Компрессор",
      main: (
        <Tooltip title={tooltipDetails}>
          <Tag color="red">{Math.round(totalLpm)} л/мин</Tag>
        </Tooltip>
      ),
      secondary: (
        <Tooltip title={tooltipDetails}>
          <Tag color="red">{Math.round(totalLpm)} л/мин</Tag>
        </Tooltip>
      ),
      reserve: (
        <Tooltip title="Резервный компрессор обеспечивает ту же производительность">
          <Tag color="red">{Math.round(totalLpm)} л/мин</Tag>
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
            Вакуум
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
      <Space style={{ marginBottom: 12, flexWrap: "wrap" }}>
        <Text>
          <b>Суммарный расход:</b>{" "}
          <Tooltip title={tooltipDetails}>
            <Tag color={gas.color}>
              {Math.round(totalLpm).toLocaleString("ru-RU")} л/мин
            </Tag>
          </Tooltip>
        </Text>

        <Text>
          <b>В пересчёте:</b>{" "}
          <Tooltip
            title={`${Math.round(totalLpm)} л/мин = ${totalM3ph.toFixed(2)} м³/ч`}
          >
            <Tag color="green">{Math.round(totalLpm)} л/мин</Tag>
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
      <Table
        size="small"
        pagination={false}
        columns={columns}
        dataSource={data}
        bordered
      />
      <Divider style={{ margin: "8px 0 12px" }} />

      <Text
        type="secondary"
        style={{
          fontSize: 12,
          lineHeight: 1.6,
          display: "block",
          marginTop: 12,
        }}
      >
        <b>Принятые допущения:</b>
        <br />• Расход вакуума рассчитывается по формуле:&nbsp;
        Vvac&nbsp;=&nbsp;Vₘ&nbsp;×&nbsp;N&nbsp;×&nbsp;K&nbsp;(л/мин);
        <br />• Коэффициент использования вакуумных точек принят&nbsp;K&nbsp;=&nbsp;0.4;
        <br />• Результирующий расход переведён в&nbsp;м³/ч для определения
        производительности вакуумной станции;
        <br />• Установлено три компрессора: основной, вторичный и резервный —
        каждый обеспечивает полную производительность;
        <br />• Расчёт ведётся без учёта пусковых и переходных режимов.
      </Text>
    </Card>
  );
}
