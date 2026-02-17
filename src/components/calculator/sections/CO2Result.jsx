import React, { useEffect, useState } from "react";
import { Card, Typography, Space, Tag, Table, Tooltip, Divider } from "antd";
import { gases } from "../../../data";

const { Title, Text } = Typography;

// Баллон CO₂: 40 л, 15 МПа ≈ 6000 л газа
const CO2_CYLINDER_VOLUME_L = 6000;

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

export default function CO2Result({ values, rooms }) {
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
  const gas = gases.find((g) => g.key === "co2");

  // Проверяем, есть ли данные по CO₂
  const hasData = Object.values(values).some(
    (roomData) => Number(roomData?.co2) > 0
  );
  if (!hasData) return null;

  let totalLPerDay = 0;
  let totalPoints = 0;
  const details = [];

  rooms.forEach((room) => {
    const N = Number(values[room.key]?.co2 || 0);
    if (N <= 0) return;

    const gp = room.gases?.find((g) => g.key === "co2");
    if (!gp) return;

    const V_m = Number(gp.flowRate ?? 0); // л/мин
    const K = Number(gp.usageFactor ?? 1);
    const t = Number(gp.hoursPerDay ?? 0);

    const V_day = V_m * N * K * t * 60; // л/сут
    totalLPerDay += V_day;
    totalPoints += N;

    details.push({ room: room.name || room.key, V_m, N, K, t, V_day });
  });

  // формула для тултипа
  const formulaExpression = details
    .map((d) => `(${d.V_m}×${d.N}×${d.K}×${d.t}×60)`)
    .join(" + ");

  const tooltipDaily = (
    <div style={{ maxWidth: 340, lineHeight: 1.5 }}>
      <div style={{ marginTop: 4 }}>
        {details.map((d, i) => (
          <div key={i}>
            <div
              style={{
                fontSize: 12,
                color: "#555",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  flex: 1,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  maxWidth: 200,
                }}
                title={d.room}
              >
                {d.room}
              </div>
              <div style={{ flexShrink: 0, fontWeight: 500 }}>
                {Math.round(d.V_day).toLocaleString("ru-RU")} л/сут
              </div>
            </div>
          </div>
        ))}
      </div>
      <hr style={{ margin: "6px 0", opacity: 0.3 }} />
      <div style={{ fontSize: 12 }}>
        {formulaExpression} ={" "}
        <b>{Math.round(totalLPerDay).toLocaleString("ru-RU")} л/сут</b>
      </div>
    </div>
  );

  // Средние значения
  const avgLpm = Math.round(totalLPerDay / 1440);
  const pipeData = getPipeDiameter(avgLpm);
  const pipe = pipeData.innerDiameterRounded;

  // Кол-во баллонов
  const cylindersPerDay = Math.ceil(totalLPerDay / CO2_CYLINDER_VOLUME_L) || 0;
  const cylTooltip = `${Math.round(totalLPerDay).toLocaleString(
    "ru-RU"
  )} ÷ ${CO2_CYLINDER_VOLUME_L} = ${cylindersPerDay} шт`;

  // Таблица
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
  ];

  const data = [
    {
      key: "ramp",
      equipment: "Рампа (баллоны)",
      main: (
        <Tooltip title={cylTooltip}>
          <Tag color="purple">{cylindersPerDay} шт</Tag>
        </Tooltip>
      ),
      secondary: (
        <Tooltip title={cylTooltip}>
          <Tag color="purple">{cylindersPerDay} шт</Tag>
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
            Углекислый газ
          </Title>
          <Tooltip title="Общее количество точек">
            <Tag>{totalPoints}</Tag>
          </Tooltip>
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
          <b>Суточный расход:</b>{" "}
          <Tooltip title={tooltipDaily}>
            <Tag color={gas.color}>
              {Math.round(totalLPerDay).toLocaleString("ru-RU")} л/сут
            </Tag>
          </Tooltip>
        </Text>

        <Text>
          <b>Средний:</b>{" "}
          <Tooltip
            title={`${Math.round(totalLPerDay).toLocaleString("ru-RU")} ÷ 1440 = ${avgLpm} л/мин`}
          >
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
        <br />• Расход углекислого газа рассчитывается по формуле:&nbsp;
        Vco₂&nbsp;=&nbsp;Vₘ&nbsp;×&nbsp;N&nbsp;×&nbsp;K&nbsp;×&nbsp;t&nbsp;×&nbsp;60&nbsp;(л/сут);
        <br />• Применяется медицинский CO₂ с давлением&nbsp;15&nbsp;МПа;
        <br />• Один баллон CO₂&nbsp;40&nbsp;л&nbsp;/&nbsp;15&nbsp;МПа&nbsp;≈&nbsp;6000&nbsp;л&nbsp;газообразного&nbsp;CO₂;
        <br />• Система снабжения включает две рампы баллонов — рабочую и резервную
        с&nbsp;автоматическим переключением при опорожнении;
        <br />• Расчёт выполняется без учёта потерь при переключении и продувке
        системы.
      </Text>
    </Card>
  );
}
