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

export default function AirResult({ values, rooms }) {
  const gasAir5 = gases.find((g) => g.key === "air5");
  const gasAir8 = gases.find((g) => g.key === "air8");
  const gasAgss = gases.find((g) => g.key === "agss");

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

  const hasData = Object.values(values).some(
    (roomData) =>
      Number(roomData?.air5) > 0 ||
      Number(roomData?.air8) > 0 ||
      Number(roomData?.agss) > 0
  );
  if (!hasData) return null;

  let totalAir5_Lpm = 0;
  let totalAir8_Lpm = 0;
  let totalAgss_M3ph = 0;
  let totalPoints = 0;
  let air5Points = 0;
  let air8Points = 0;
  let agssPoints = 0;
  const details = [];

  rooms.forEach((room) => {
    const N5 = Number(values[room.key]?.air5 || 0);
    const N8 = Number(values[room.key]?.air8 || 0);
    const Nagss = Number(values[room.key]?.agss || 0);

    if (N5 + N8 + Nagss <= 0) return;

    const gp5 = room.gases?.find((g) => g.key === "air5");
    const gp8 = room.gases?.find((g) => g.key === "air8");

    if (N5 > 0 && gp5) {
      const V_m = gp5.flowRate ?? 0;
      const K = gp5.usageFactor ?? 1;
      const V = V_m * N5 * K;
      totalAir5_Lpm += V;
      details.push({
        room: room.name,
        type: "Air5",
        formula: `${V_m}×${N5}×${K}`,
        value: V,
      });
      totalPoints += N5;
      air5Points += N5;
    }

    if (N8 > 0 && gp8) {
      const K = gp8.usageFactor ?? 1;
      const V = 350 * N8 * K;
      totalAir8_Lpm += V;
      details.push({
        room: room.name,
        type: "Air8",
        formula: `350×${N8}×${K}`,
        value: V,
      });
      totalPoints += N8;
      air8Points += N8;
    }

    // AGSS: 1 точка = 3 м³/ч
    if (Nagss > 0) {
      const V = Nagss * 3; // м³/ч
      totalAgss_M3ph += V;
      details.push({
        room: room.name,
        type: "AGSS",
        formula: `${Nagss}×3`,
        value: V,
      });
      totalPoints += Nagss;
      agssPoints += Nagss;
    }
  });

  // Пересчёты: общие значения в л/мин и перевод AGSS из м³/ч → л/мин
  const totalAir_Lpm = totalAir5_Lpm + totalAir8_Lpm;
  const totalAgss_Lpm = (totalAgss_M3ph * 1000) / 60; // м³/ч -> л/мин
  const totalWithAgss_Lpm = totalAir_Lpm + totalAgss_Lpm;
  const pipeData = getPipeDiameter(totalWithAgss_Lpm);
  const pipe = pipeData.innerDiameterRounded;

  const tooltipDetails = (
    <div style={{ maxWidth: 360, lineHeight: 1.5 }}>
      {details.map((d, i) => (
        <div
          key={i}
          style={{
            fontSize: 12,
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 2,
          }}
        >
          <span title={d.room}>
            {d.room} ({d.type}): {d.formula}
          </span>
          <b>
            {d.type === "AGSS"
              ? `${d.value.toFixed(2)} м³/ч`
              : `${Math.round(d.value)} л/мин`}
          </b>
        </div>
      ))}
      <hr style={{ margin: "6px 0", opacity: 0.3 }} />
      <div style={{ fontSize: 12 }}>
        Σ Air5+Air8 = <b>{Math.round(totalAir_Lpm)} л/мин</b> <br />
        Σ AGSS = <b>{Math.round(totalAgss_Lpm)} л/мин</b> <br />
        <b>Итого:</b> {Math.round(totalWithAgss_Lpm)} л/мин
      </div>
    </div>
  );

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
      key: "compressor_with_agss",
      equipment: "Компрессор с учётом AGSS",
      main: (
        <Tooltip title={tooltipDetails}>
          <Tag color="orange">{Math.round(totalWithAgss_Lpm)} л/мин</Tag>
        </Tooltip>
      ),
      secondary: (
        <Tooltip title={tooltipDetails}>
          <Tag color="orange">{Math.round(totalWithAgss_Lpm)} л/мин</Tag>
        </Tooltip>
      ),
      reserve: (
        <Tooltip title="Резервный комплект обеспечивает аналогичную подачу">
          <Tag color="orange">{Math.round(totalWithAgss_Lpm)} л/мин</Tag>
        </Tooltip>
      ),
    },
    {
      key: "agss_station",
      equipment: "Станция отвода AGSS",
      main: (
        <Tooltip title={`AGSS: ${totalAgss_M3ph.toFixed(2)} м³/ч = ${Math.round(totalAgss_Lpm)} л/мин`}>
          <Tag color="gold">{Math.round(totalAgss_Lpm)} л/мин</Tag>
        </Tooltip>
      ),
      secondary: (
        <Tooltip title={`AGSS: ${totalAgss_M3ph.toFixed(2)} м³/ч = ${Math.round(totalAgss_Lpm)} л/мин`}>
          <Tag color="gold">{Math.round(totalAgss_Lpm)} л/мин</Tag>
        </Tooltip>
      ),
      reserve: (
        <Tooltip title="Резервный канал отвода обеспечивает ту же производительность">
          <Tag color="gold">{Math.round(totalAgss_Lpm)} л/мин</Tag>
        </Tooltip>
      ),
    },
    {
      key: "compressor_no_agss",
      equipment: "Компрессор без учёта AGSS",
      main: (
        <Tooltip title={`Air (без AGSS): ${Math.round(totalAir_Lpm)} л/мин`}>
          <Tag color="blue">{Math.round(totalAir_Lpm)} л/мин</Tag>
        </Tooltip>
      ),
      secondary: (
        <Tooltip title={`Air (без AGSS): ${Math.round(totalAir_Lpm)} л/мин`}>
          <Tag color="blue">{Math.round(totalAir_Lpm)} л/мин</Tag>
        </Tooltip>
      ),
      reserve: (
        <Tooltip title="Резервный комплект компрессоров обеспечивает ту же подачу">
          <Tag color="blue">{Math.round(totalAir_Lpm)} л/мин</Tag>
        </Tooltip>
      ),
    },
  ];

  return (
    <Card
      title={
        <Space align="center" size={10} wrap>
          {air5Points > 0 && (
            <Space align="center">
              <span style={{ color: gasAir5.color, fontSize: 18 }}>
                {gasAir5.icon}
              </span>
              <Text strong style={{ color: gasAir5.color }}>
                Air 5
              </Text>
            </Space>
          )}

          {air8Points > 0 && (
            <Space align="center">
              <span style={{ color: gasAir8.color, fontSize: 18 }}>
                {gasAir8.icon}
              </span>
              <Text strong style={{ color: gasAir8.color }}>
                Air 8
              </Text>
            </Space>
          )}

          {agssPoints > 0 && (
            <Space align="center">
              <span style={{ color: gasAgss.color, fontSize: 18 }}>
                {gasAgss.icon}
              </span>
              <Text strong style={{ color: gasAgss.color }}>
                AGSS
              </Text>
            </Space>
          )}

          <Tooltip title="Общее количество точек">
            <Tag>{totalPoints}</Tag>
          </Tooltip>
        </Space>
      }
      style={{
        marginTop: 16,
        margin: isMobile ? "10px 0" : 10,
        borderLeft: `4px solid ${gasAir5.color}`,
        textAlign: "left",
        maxWidth: 546,
      }}
      headStyle={{
        background: `${gasAir5.color}10`,
        borderBottom: `1px solid ${gasAir5.color}30`,
      }}
    >
      <Space style={{ marginBottom: 12, flexWrap: "wrap" }}>
        <Text>
          <b>Общий расход:</b>{" "}
          <Tooltip title={tooltipDetails}>
            <Tag color={gasAir5.color}>{Math.round(totalWithAgss_Lpm)} л/мин</Tag>
          </Tooltip>
        </Text>

        <Text>
          <b>Без AGSS:</b>{" "}
          <Tag color="blue">{Math.round(totalAir_Lpm)} л/мин</Tag>
        </Text>

        <Text>
          <b>AGSS:</b>{" "}
          <Tooltip title="1 точка = 3 м³/ч ( = 50 л/мин )">
            <Tag color="gold">{Math.round(totalAgss_Lpm)} л/мин</Tag>
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

      <Text type="secondary" style={{ fontSize: 12, lineHeight: 1.6 }}>
        <b>Принятые допущения:</b>
        <br />• <b>Air&nbsp;5&nbsp;(0.4 МПа):</b>&nbsp;V&nbsp;=&nbsp;Vₘ&nbsp;×&nbsp;N&nbsp;×&nbsp;K&nbsp;(л/мин);
        <br />• <b>Air&nbsp;8&nbsp;(0.8 МПа):</b>&nbsp;V&nbsp;=&nbsp;350&nbsp;×&nbsp;N&nbsp;×&nbsp;K&nbsp;(л/мин);
        <br />• <b>AGSS:</b>&nbsp;1&nbsp;точка&nbsp;=&nbsp;3 м³/ч&nbsp;(добавляется к&nbsp;общему расходу воздуха);
        <br />• Производительность станции указана без учёта резервного компрессора;
        <br />• Один комплект оборудования — рабочий, другой — резервный.
      </Text>
    </Card>
  );
}
