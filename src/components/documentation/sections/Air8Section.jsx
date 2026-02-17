import React from "react";
import { Card, Typography, Tag, Divider } from "antd";
import GasDocsTable from "../GasDocsTable";
import { gases } from "../../../data";

const { Title, Paragraph, Text } = Typography;

export default function Air8Section() {
  const gas = gases.find((g) => g.key === "air8");

  return (
    <Card
      bordered
      style={{ borderRadius: 12, padding: 16 }}
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Tag
            color={gas.color}
            style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}
          >
            {gas.icon}
            {gas.label}
          </Tag>
        </span>
      }
    >
      {/* 1. Область применения */}
      <Paragraph>
        <Text strong>Область применения:</Text> сжатый воздух 0.8 МПа (Air 8)
        используется для привода пневматических хирургических инструментов, систем аспирации и другого оборудования,
        требующего повышенного давления. Применяется в операционных, хирургических, травматологических и стоматологических кабинетах.
      </Paragraph>

      {/* 2. Нормативная база */}
      <Paragraph>
        <Text strong>Нормативная база:</Text> расчёт выполняется по{" "}
        <Text code>СП 158.13330.2014</Text>. Расход определяется по числу точек и коэффициенту одновременности,
        зависящему от количества подключаемых инструментов.
      </Paragraph>

      <Divider />

      {/* 3. Формула */}
      <Paragraph>
        <Text strong>Формула расчёта:</Text>
      </Paragraph>
      <Paragraph
        code
        style={{
          fontSize: 16,
          padding: "8px 12px",
          borderRadius: 6,
          display: "inline-block",
        }}
      >
        {gas.formulaSymbolic}
      </Paragraph>
      <Paragraph type="secondary" style={{ marginTop: 6 }}>
        {gas.formulaText}
      </Paragraph>

      <Divider />

      {/* 4. Единицы */}
      <Paragraph>
        <Text strong>Единицы измерения:</Text> {gas.unit}
      </Paragraph>

      <Divider />

      {/* 5. Особенности расчёта */}
      <Title level={5}>Особенности расчёта для пневмоинструментов</Title>
      <Paragraph>
        Расход воздуха принимается из расчёта 350 л/мин на одну точку.
        Коэффициент одновременности принимается:
        <ul style={{ marginLeft: 20 }}>
          <li>0.7 — для 2–4 точек потребления;</li>
          <li>0.5 — для 4–6 точек;</li>
          <li>0.3 — для 6–10 точек.</li>
        </ul>
      </Paragraph>

      <Divider />

      {/* 6. Размещение и вентиляция */}
      <Title level={5}>Размещение и эксплуатация станции</Title>
      <Paragraph>
        Станции размещаются в подвальных или цокольных помещениях под вспомогательными зонами (без постоянного пребывания людей). 
        Температура воздуха 10–35 °C. Вентиляция рассчитывается по формуле:
      </Paragraph>
      <Paragraph
        code
        style={{
          padding: "8px 12px",
          borderRadius: 6,
          display: "inline-block",
        }}
      >
        Q<sub>v</sub> = P<sub>v</sub> / (1.16 × ΔT)
      </Paragraph>
      <Paragraph type="secondary">
        где Q<sub>v</sub> — объём воздуха на вентиляцию (м³/с), P<sub>v</sub> — тепловыделение (кВт), ΔT — повышение температуры в зале компрессоров.
      </Paragraph>

      <Divider />

      {/* 7. Таблица */}
      <Paragraph>
        <Text strong>Нормативные параметры расхода по типам помещений:</Text>
      </Paragraph>
      <GasDocsTable gasKey="air8" />
      <Paragraph
        type="secondary"
        style={{
          marginTop: 16,
          fontStyle: "italic",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        Нормативы по СП 158.13330.2014 уточняются в зависимости от числа подключённых инструментов и режима работы станции.
      </Paragraph>
    </Card>
  );
}
