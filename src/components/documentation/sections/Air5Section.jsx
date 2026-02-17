import React from "react";
import { Card, Typography, Tag, Divider } from "antd";
import GasDocsTable from "../GasDocsTable";
import { gases } from "../../../data";

const { Title, Paragraph, Text } = Typography;

export default function Air5Section() {
  const gas = gases.find((g) => g.key === "air5");

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
        <Text strong>Область применения:</Text> сжатый воздух 0.4 МПа (Air 5)
        используется для питания дыхательных аппаратов, систем подачи
        стерильного воздуха, а также для пневматического оборудования
        в операционных, палатах интенсивной терапии, перевязочных,
        процедурных, родовых, эндоскопиях и других помещениях.
      </Paragraph>

      {/* 2. Нормативная база */}
      <Paragraph>
        <Text strong>Нормативная база:</Text> расчёт выполняется по{" "}
        <Text code>СП 158.13330.2014</Text>. Расход определяется количеством
        точек N и коэффициентом использования K<sub>air</sub>, зависящим от
        типа помещения.
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

      {/* 5. Состав системы */}
      <Title level={5}>Система сжатого воздуха (0.4 МПа)</Title>
      <Paragraph>
        Система состоит из источника — 
        <Text strong>медицинской станции сжатого воздуха</Text> —
        и сети трубопроводов с газораздаточными розетками.
      </Paragraph>
      <Paragraph>
        В состав станции входят:
        <ul style={{ marginLeft: 20 }}>
          <li>компрессоры (не менее 2, один резервный);</li>
          <li>ресиверы (не подлежащие регистрации Ростехнадзора);</li>
          <li>блок управления станцией;</li>
          <li>блоки осушки и рампы фильтров очистки воздуха;</li>
          <li>
            один комплект (компрессор + осушка + фильтры) — рабочий, второй —
            резервный.
          </li>
        </ul>
      </Paragraph>

      <Divider />

      {/* 6. Размещение и вентиляция */}
      <Title level={5}>Размещение и условия эксплуатации</Title>
      <Paragraph>
        Станции размещают в подвале или цоколе под вспомогательными помещениями
        (вестибюль, гардероб, склад белья и др.).
        Температура в помещении — от 10 до 35 °C.
      </Paragraph>
      <Paragraph>
        Для вентиляции объём воздуха Q<sub>v</sub> рассчитывается по формуле:
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
        где P<sub>v</sub> — тепловая нагрузка (кВт), ΔT — допустимое повышение температуры в компрессорной.
      </Paragraph>

      <Divider />

      {/* 7. Таблица */}
      <Paragraph>
        <Text strong>Нормативные параметры расхода по типам помещений:</Text>
      </Paragraph>
      <GasDocsTable gasKey="air5" />
      <Paragraph
        type="secondary"
        style={{
          marginTop: 16,
          fontStyle: "italic",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        Значения по СП 158.13330.2014 могут уточняться по проекту в зависимости от режима работы и оборудования.
      </Paragraph>
    </Card>
  );
}
