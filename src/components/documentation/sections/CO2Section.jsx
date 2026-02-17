import React from "react";
import { Card, Typography, Tag, Divider } from "antd";
import GasDocsTable from "../GasDocsTable";
import { gases } from "../../../data";

const { Title, Paragraph, Text } = Typography;

export default function CO2Section() {
  const gas = gases.find((g) => g.key === "co2");

  return (
    <Card
      bordered
      style={{
        borderRadius: 12,
        padding: 16,
      }}
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Tag
            color={gas.color}
            style={{
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {gas.icon}
            {gas.label}
          </Tag>
        </span>
      }
    >
      {/* --- 1. Область применения --- */}
      <Paragraph>
        <Text strong>Область применения:</Text> углекислый газ (CO₂) используется
        в медицинских организациях в операционных, где применяются лапароскопические
        и криогенные методики (аппараты криодеструкции), а также в ванных залах,
        эмбриологических лабораториях и помещениях с CO₂-инкубаторами.
      </Paragraph>

      <Paragraph>
        <Text strong>Назначение:</Text> CO₂ служит для создания рабочего давления
        в инсуффляторах при лапароскопии, для криодеструкции тканей, а также
        для поддержания заданной газовой среды в биологических и эмбриологических
        установках.
      </Paragraph>

      <Divider />

      {/* --- 2. Нормативная база --- */}
      <Paragraph>
        <Text strong>Нормативная база:</Text> расчёт выполняется в соответствии с{" "}
        <Text code>СП 158.13330.2014</Text> — «Здания и помещения медицинских
        организаций». Расход CO₂ определяется по количеству точек потребления,
        времени использования и коэффициенту использования, указанным в таблице 7.7.
      </Paragraph>

      <Divider />

      {/* --- 3. Формула расчёта --- */}
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

      {/* --- 4. Единицы --- */}
      <Paragraph>
        <Text strong>Единицы измерения:</Text> {gas.unit}
      </Paragraph>

      <Divider />

      {/* --- 5. Система снабжения --- */}
      <Title level={5}>Система централизованного снабжения CO₂</Title>
      <Paragraph>
        Система включает источник (двухплечевую рампу для 40-литровых баллонов) и сеть
        трубопроводов, соединённых с газораздаточными розетками. Одно плечо рампы —
        <Text strong> рабочее</Text>, второе — <Text strong>резервное</Text>.
        При опорожнении рабочих баллонов система автоматически переключается
        на резервную группу.
      </Paragraph>

      <Paragraph>
        Рампы с баллонами CO₂ размещаются в{" "}
        <Text strong>помещении управления медицинскими газами</Text>, где также
        находятся узлы распределения и рампы закиси азота. Эти помещения должны иметь
        оконные проёмы, быть расположены на любом этаже, кроме подвалов, и
        соответствовать требованиям раздела 7.4.8 СП.
      </Paragraph>

      <Paragraph>
        Баллоны с углекислым газом должны устанавливаться на расстоянии не менее{" "}
        <Text strong>1 м от радиаторов отопления</Text> и других нагревательных приборов.
      </Paragraph>

      <Divider />

      {/* --- 6. Таблица параметров --- */}
      <Title level={5}>Нормативные параметры расхода CO₂</Title>
      <Paragraph>
        <Text strong>Таблица 7.7 СП 158.13330.2014:</Text>
      </Paragraph>

      <ul style={{ marginLeft: 20 }}>
        <li>Операционные, малые операционные — 13 л/мин, 1 ч в сутки;</li>
        <li>Эмбриологические помещения — 15 л/мин, 1 ч в сутки;</li>
        <li>
          Ванные залы — расход определяется по <Text strong>заданию на проектирование</Text>.
        </li>
      </ul>

      <Paragraph type="secondary">
        Длительность использования и расход могут изменяться в зависимости от
        технологии и оборудования (например, постоянные CO₂-инкубаторы).
      </Paragraph>

      <Divider />

      {/* --- 7. Таблица (приложение проекта) --- */}
      <Paragraph>
        <Text strong>Нормативные параметры расхода по типам помещений:</Text>
      </Paragraph>
      <GasDocsTable gasKey="co2" />

      <Paragraph
        type="secondary"
        style={{
          marginTop: 16,
          fontStyle: "italic",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        Нормативные данные приведены по СП 158.13330.2014.  
        Рекомендуется учитывать фактические параметры работы оборудования
        (инсуффляторов, инкубаторов, криоаппаратов) и режим работы отделений.
      </Paragraph>
    </Card>
  );
}
