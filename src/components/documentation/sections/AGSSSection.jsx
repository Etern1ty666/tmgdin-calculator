import React from "react";
import { Card, Typography, Tag, Divider } from "antd";
import GasDocsTable from "../GasDocsTable";
import { gases } from "../../../data";

const { Title, Paragraph, Text } = Typography;

export default function AgssSection() {
  const gas = gases.find((g) => g.key === "agss");

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
      {/* --- Таблица параметров --- */}
      <GasDocsTable gasKey="agss" />
      <Divider />
      {/* --- 1. Область применения --- */}
      <Paragraph>
        <Text strong>Область применения:</Text> система удаления анестетических
        газов (AGSS — Anesthetic Gas Scavenging System) предназначена для
        удаления избытка анестетических и дыхательных газов, выделяемых из
        наркозных аппаратов и дыхательных контуров, с целью предотвращения
        их накопления в воздухе помещений. Применяется в{" "}
        <Text strong>операционных, наркозных, палатах интенсивной терапии и
        процедурных залах</Text>, где проводится ингаляционная анестезия.
      </Paragraph>

      <Paragraph>
        AGSS обеспечивает безопасное удаление паров и газов, таких как закись
        азота, севофлуран, изофлуран и другие, предотвращая воздействие на
        медицинский персонал.
      </Paragraph>

      <Divider />

      {/* --- 2. Нормативная база --- */}
      <Paragraph>
        <Text strong>Нормативная база:</Text> проектирование и расчёт систем
        AGSS выполняется в соответствии с{" "}
        <Text code>СП 158.13330.2014</Text> (раздел 7.4 «Системы медицинских
        газов») и международными стандартами{" "}
        <Text code>ISO 7396-2</Text> / <Text code>EN 737-2</Text>, определяющими
        требования к системам удаления анестетических газов.
      </Paragraph>

      <Paragraph type="secondary">
        При проектировании также учитываются требования СанПиН 2.1.3.2630-10
        и ГОСТ Р ISO 7396-2-2011 (национальный аналог ISO 7396-2).
      </Paragraph>

      <Divider />

      {/* --- 3. Формула расчёта --- */}
      <Paragraph>
        <Text strong>Формула расчёта условного расхода:</Text>
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

      {/* --- 4. Единицы измерения --- */}
      <Paragraph>
        <Text strong>Единицы измерения:</Text> {gas.unit}
      </Paragraph>

      <Divider />

      {/* --- 5. Конструкция системы --- */}
      <Title level={5}>Конструкция и принципы работы AGSS</Title>

      <Paragraph>
        Система AGSS состоит из следующих элементов:
        <ul style={{ marginLeft: 20 }}>
          <li>соединения с дыхательными контурами наркозных аппаратов;</li>
          <li>газоотводного трубопровода (вакуумной линии);</li>
          <li>агрегата удаления (вакуумного вентилятора или эжектора);</li>
          <li>вентиляционного выброса в атмосферу вне здания;</li>
          <li>системы контроля давления и обратных клапанов для предотвращения обратного потока.</li>
        </ul>
      </Paragraph>

      <Paragraph>
        Допускается использование как <Text strong>централизованной системы</Text>,
        объединённой с вакуумной станцией, так и <Text strong>автономных локальных
        установок</Text> на каждую операционную. Для операционных с постоянной
        подачей анестетических газов рекомендуется централизованная схема AGSS
        с индивидуальной регулировкой расхода.
      </Paragraph>

      <Divider />

      {/* --- 6. Расчёт и проектирование --- */}
      <Title level={5}>Расчёт и требования к проектированию</Title>

      <Paragraph>
        Расчётная производительность AGSS принимается по суммарной подаче
        от всех подключённых наркозных аппаратов. Минимальный расчётный расход:
      </Paragraph>

      <ul style={{ marginLeft: 20 }}>
        <li>для одной операционной — не менее 25–50 л/мин на каждый наркозный аппарат;</li>
        <li>давление в трубопроводе — до −20 кПа относительно атмосферного;</li>
        <li>коэффициент использования — 0.5–0.8 (в зависимости от режима работы);</li>
        <li>система должна обеспечивать не менее 99,9 % эффективности удаления газов.</li>
      </ul>

      <Paragraph>
        Размещение агрегатов AGSS допускается в общих помещениях с вакуумными
        насосами при условии соблюдения акустических и вентиляционных норм.
      </Paragraph>

      <Divider />

      {/* --- 7. Таблица нормативных параметров --- */}
      <Paragraph>
        <Text strong>Нормативные параметры расхода по типам помещений:</Text>
      </Paragraph>

      <GasDocsTable gasKey="agss" />

      <Paragraph
        type="secondary"
        style={{
          marginTop: 16,
          fontStyle: "italic",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        Параметры AGSS приведены в СП 158.13330.2014 (раздел 7.4) и ISO 7396-2.  
        Расход и производительность уточняются на этапе проектирования в зависимости
        от числа наркозных постов, схемы вентиляции и типа применяемых анестетиков.
      </Paragraph>
    </Card>
  );
}
