import React, { useState, useCallback } from "react";
import {
  Table,
  InputNumber,
  Typography,
  Tooltip,
  Card,
  Row,
  Col,
  Checkbox,
  Divider,
  Select,
  Space,
} from "antd";
import { gases, rooms } from "./data";

const { Text } = Typography;
const { Option } = Select;

/* ---------- Константы (можно править) ---------- */

// Ключи помещений, которые относятся к операционным/интенсивной/реанимации
// (используются для расчёта резервного источника на 3 часа)
const RESERVE_ROOM_KEYS = new Set([
  "operating",
  "small_operating",
  "icu_adults",
  "icu_children",
  "icu_adults_rea",
  "icu_children_rea",
  "adults_rea",
  "children_rea",
  "angiography",
  // добавь сюда нужные ключи из твоих данных, если нужно
]);

// Объём одного кислородного 40-литрового баллона в литрах
const OXYGEN_CYLINDER_VOLUME_L = 6000; // по 7.4.2.11

/* ---------- Функции расчётов ---------- */

/**
 * Общий (по таблице 7.3) расход для одной комнаты и заданного газа
 * Возвращает литров в сутки (л/сут)
 * Формула: V_nom * N * K * k * 60  (литров в сутки)
 */
const calcDailyLitersByRoom = (room, points, gasKey) => {
  if (!points) return 0;
  const gas = room.gases?.find((g) => g.key === gasKey);
  if (!gas) return 0;

  const V_nom = gas.flowRate || 0; // л/мин
  const N = points;
  const K = gas.usageFactor ?? 1; // коэффициент использования
  const k = gas.hoursPerDay ?? 1; // часов в сутки

  // литров в сутки
  return V_nom * N * K * k * 60;
};

/**
 * Расход для резервного источника (3 часа) по одной комнате при K_reserve = 1
 * Возвращает литров за 3 часа (л)
 * Формула: V_nom * N * 1 * 3 * 60
 */
const calcReserveLitersByRoom3h = (room, points, gasKey) => {
  if (!points) return 0;
  const gas = room.gases?.find((g) => g.key === gasKey);
  if (!gas) return 0;

  const V_nom = gas.flowRate || 0; // л/мин
  const N = points;

  return V_nom * N * 1 * 3 * 60; // л за 3 часа
};

/* ---------- Карточки (AntD) ---------- */

const OxygenSourcesTable = ({ sources }) => {
  // sources: [{ name, m3h, litersPerDay, litersFor3h, cylindersPerShoulder, concentrators }]
  const columns = [
    { title: "Источник", dataIndex: "name", key: "name" },
    {
      title: "м³/ч (экв.)",
      dataIndex: "m3h",
      key: "m3h",
      align: "right",
      render: (v) => (v == null ? "—" : Number(v).toFixed(3)),
    },
    {
      title: "л/сут",
      dataIndex: "litersPerDay",
      key: "litersPerDay",
      align: "right",
      render: (v) => (v == null ? "—" : Math.round(v)),
    },
    {
      title: "л (резерв 3ч)",
      dataIndex: "litersFor3h",
      key: "litersFor3h",
      align: "right",
      render: (v) => (v == null ? "—" : Math.round(v)),
    },
    {
      title: "Баллоны (40л, шт.)",
      dataIndex: "cylindersPerShoulder",
      key: "cylindersPerShoulder",
      align: "center",
      render: (v) => (v == null ? "—" : v),
    },
    {
      title: "Концентраторы (шт.)",
      dataIndex: "concentrators",
      key: "concentrators",
      align: "center",
      render: (v) => (v == null ? "—" : v),
    },
  ];

  return <Table size="small" columns={columns} dataSource={sources} pagination={false} />;
};

const OxygenCard = ({ icon, label, totalPoints, totalHourlyM3, totalDailyLiters, sources }) => (
  <Card hoverable style={{ width: "100%" }}>
    <Card.Meta
      avatar={icon}
      title={label}
      description={
        <>
          <p><b>Точек всего:</b> {totalPoints}</p>
          <p><b>Общий часовой расход:</b> {totalHourlyM3.toFixed(3)} м³/ч</p>
          <p><b>Суточный объем:</b> {Math.round(totalDailyLiters)} л/сут</p>

          <Divider style={{ margin: "8px 0" }} />

          <Text strong>Источники (расчёт):</Text>
          <OxygenSourcesTable sources={sources} />
        </>
      }
    />
  </Card>
);

/* ---------- Основной компонент ---------- */

const GasTable = () => {
  const [values, setValues] = useState({});
  const [focusedCell, setFocusedCell] = useState(null);
  const [selectedGases, setSelectedGases] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);

  // выбор всех газов / отдельных
  const handleSelectAllGases = (checked) => {
    setSelectedGases(checked ? gases.map((g) => g.key) : []);
  };
  const handleSelectGas = (gasKey, checked) => {
    setSelectedGases((prev) => (checked ? [...prev, gasKey] : prev.filter((k) => k !== gasKey)));
  };

  // выбор помещений
  const handleSelectRooms = (vals) => setSelectedRooms(vals);

  // изменение ячеек
  const createChangeHandler = useCallback((roomKey, gasKey) => (value) => {
    setValues((prev) => ({
      ...prev,
      [roomKey]: { ...prev[roomKey], [gasKey]: value },
    }));
  }, []);

  // фильтр выбранных помещений
  const filteredRooms = rooms.filter((r) => selectedRooms.includes(r.key));

  // таблица: колонки динамические по выбранным газам
  const columns = [
    {
      title: "Помещения / количество точек",
      dataIndex: "name",
      key: "name",
      fixed: "left",
      width: 280,
      render: (text, record) => (record.type === "section" ? <Text strong>{text}</Text> : text),
    },
    ...gases
      .filter((g) => selectedGases.includes(g.key))
      .map((gas) => ({
        title: (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {gas.icon}
            <span style={{ fontSize: 12 }}>{gas.label}</span>
          </div>
        ),
        dataIndex: gas.key,
        key: gas.key,
        align: "center",
        render: (value, record) => {
          if (record.type === "section") return null;
          const roomHasGas = record.gases?.some((gg) => gg.key === gas.key);
          if (!roomHasGas) return "Не используется";

          const isFocused = focusedCell?.roomKey === record.key && focusedCell?.gasKey === gas.key;
          const handleChange = createChangeHandler(record.key, gas.key);

          return (
            <Tooltip
              title={
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {gas.icon}
                  <span>{gas.label}</span>
                </div>
              }
              placement="top"
              open={isFocused ? true : undefined}
            >
              <InputNumber
                min={0}
                value={values[record.key]?.[gas.key]}
                onChange={handleChange}
                onFocus={() => setFocusedCell({ roomKey: record.key, gasKey: gas.key })}
                onBlur={() => setFocusedCell(null)}
              />
            </Tooltip>
          );
        },
      })),
  ];

  // summary: сумма точек по выбранным помещениям
  const summaryData = gases.reduce((acc, gas) => {
    let total = 0;
    selectedRooms.forEach((roomKey) => {
      total += values[roomKey]?.[gas.key] || 0;
    });
    acc[gas.key] = total;
    return acc;
  }, {});

  /* ========== Подготовка данных для карточек (особенно Oxygen) ========== */
  const cardData = gases
    .filter((gas) => selectedGases.includes(gas.key))
    .map((gas) => {
      // total points (сумма по выбранным комнатам)
      const totalPoints = selectedRooms.reduce((s, roomKey) => s + (values[roomKey]?.[gas.key] || 0), 0);

      // общий суточный расход (л/сут)
      let totalDailyLiters = 0;
      selectedRooms.forEach((roomKey) => {
        const pt = values[roomKey]?.[gas.key];
        if (!pt) return;
        const room = rooms.find((r) => r.key === roomKey);
        if (!room) return;
        totalDailyLiters += calcDailyLitersByRoom(room, pt, gas.key);
      });

      // часовой расход в м3/ч
      const totalHourlyM3 = gas.key === "vacuum" ? totalDailyLiters : (totalDailyLiters / 24 / 1000);

      // === special: oxygen sources ===
      let sources = [];
      if (gas.key === "oxygen") {
        // основной и вторичный: 100% суммарной потребности
        sources.push({
          key: "primary",
          name: "Основной (газификатор / рампа / концентратор)",
          m3h: totalHourlyM3,
          litersPerDay: totalDailyLiters,
          litersFor3h: null,
          cylindersPerShoulder: gas.allowCylinders ? Math.ceil((totalDailyLiters * 3) / OXYGEN_CYLINDER_VOLUME_L) : null,
          concentrators: gas.concentratorFlow
            ? Math.ceil(((totalHourlyM3 * 1000) / 60) / gas.concentratorFlow)
            : null,
        });

        sources.push({
          key: "secondary",
          name: "Вторичный (автоматический резерв)",
          m3h: totalHourlyM3,
          litersPerDay: totalDailyLiters,
          litersFor3h: null,
          cylindersPerShoulder: gas.allowCylinders ? Math.ceil((totalDailyLiters * 3) / OXYGEN_CYLINDER_VOLUME_L) : null,
          concentrators: gas.concentratorFlow
            ? Math.ceil(((totalHourlyM3 * 1000) / 60) / gas.concentratorFlow)
            : null,
        });

        // резервный: только по операционным и реанимациям — на 3 часа при K=1
        let reserveLiters3h = 0;
        selectedRooms.forEach((roomKey) => {
          if (!RESERVE_ROOM_KEYS.has(roomKey)) return;
          const pt = values[roomKey]?.[gas.key];
          if (!pt) return;
          const room = rooms.find((r) => r.key === roomKey);
          if (!room) return;
          reserveLiters3h += calcReserveLitersByRoom3h(room, pt, gas.key);
        });

        const reserveM3hEquivalent = reserveLiters3h > 0 ? (reserveLiters3h / 1000) / 3 : 0;

        sources.push({
          key: "reserve",
          name: "Резервный (покрытие операций и реанимаций на 3 ч, K=1)",
          m3h: reserveM3hEquivalent,
          litersPerDay: null,
          litersFor3h: reserveLiters3h,
          cylindersPerShoulder: gas.allowCylinders ? Math.ceil((reserveLiters3h * 1) / OXYGEN_CYLINDER_VOLUME_L) : null,
          concentrators: gas.concentratorFlow
            ? Math.ceil((((reserveM3hEquivalent * 1000) / 60)) / gas.concentratorFlow)
            : null,
        });
      }

      // CO2 and others handled by generic card (CO2 has its own card elsewhere)
      return {
        ...gas,
        totalPoints,
        totalDailyLiters,
        totalHourlyM3,
        sources,
      };
    })
    .filter((g) => g.totalPoints > 0);

  /* ================= RENDER ================= */
  return (
    <div style={{ width: "100%" }}>
      {/* Панель выбора */}
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Checkbox
              indeterminate={
                selectedGases.length > 0 && selectedGases.length < gases.length
              }
              checked={selectedGases.length === gases.length}
              onChange={(e) => handleSelectAllGases(e.target.checked)}
            >
              Все газы
            </Checkbox>

            <Divider style={{ margin: "8px 0" }} />

            <div>
              {gases.map((gas) => (
                <div key={gas.key} style={{ marginBottom: 6 }}>
                  <Checkbox
                    checked={selectedGases.includes(gas.key)}
                    onChange={(e) => handleSelectGas(gas.key, e.target.checked)}
                  >
                    {gas.icon} {gas.label}
                  </Checkbox>
                </div>
              ))}
            </div>
          </div>

          <Divider />

          <div>
            <Text strong>Выберите помещения:</Text>
            <Select
              mode="multiple"
              style={{ width: "100%", marginTop: 8 }}
              placeholder="Выберите помещения"
              value={selectedRooms}
              onChange={handleSelectRooms}
              allowClear
            >
              {rooms.map((room) => (
                <Option key={room.key} value={room.key}>
                  {room.name}
                </Option>
              ))}
            </Select>
          </div>
        </Space>
      </Card>

      {/* Таблица */}
      <Table
        bordered
        columns={columns}
        dataSource={filteredRooms.map((r, i) => ({ ...r, key: r.key || `section-${i}` }))}
        pagination={false}
        scroll={{ x: "max-content" }}
        rowClassName={(record) => (record.type === "section" ? "section-row" : "")}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell>
              <Text strong>Итого</Text>
            </Table.Summary.Cell>

            {gases
              .filter((gas) => selectedGases.includes(gas.key))
              .map((gas) => (
                <Table.Summary.Cell key={gas.key} align="center">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 8, minWidth: 80 }}>
                    {gas.icon}
                    <Text style={{ fontSize: 12, marginTop: 6 }}>{gas.label}</Text>
                    <Text style={{ fontSize: 14, fontWeight: 500, marginTop: 6 }}>
                      {summaryData[gas.key] ?? 0}
                    </Text>
                  </div>
                </Table.Summary.Cell>
              ))}
          </Table.Summary.Row>
        )}
      />

      {/* Карточки: для каждого выбранного газа — своя карточка */}
      <Row gutter={[16, 16]} style={{ marginTop: 20, width: "100%" }}>
        {cardData.map((g) => (
          <Col key={g.key} xs={24} sm={24} md={12} lg={8}>
            {g.key === "vacuum" ? (
              <Card hoverable style={{ width: "100%", background: "#fafafa" }}>
                <Card.Meta
                  avatar={g.icon}
                  title={g.label}
                  description={
                    <>
                      <p>Точек: {g.totalPoints}</p>
                      <p>Часовой (экв.): {g.totalHourlyM3.toFixed(3)} м³/ч</p>
                      <p>Суточный (л/сут): {Math.round(g.totalDailyLiters)}</p>
                    </>
                  }
                />
              </Card>
            ) : g.key === "co2" ? (
              // CO2 card: можно оставить как раньше (в другом месте) — здесь упрощенно
              <Card hoverable style={{ width: "100%" }}>
                <Card.Meta
                  avatar={g.icon}
                  title={g.label}
                  description={
                    <>
                      <p>Точек: {g.totalPoints}</p>
                      <p>Суточный (л/сут): {Math.round(g.totalDailyLiters)}</p>
                    </>
                  }
                />
              </Card>
            ) : g.key === "oxygen" ? (
              <OxygenCard
                icon={g.icon}
                label={g.label}
                totalPoints={g.totalPoints}
                totalHourlyM3={g.totalHourlyM3}
                totalDailyLiters={g.totalDailyLiters}
                sources={g.sources}
              />
            ) : (
              // generic
              <Card hoverable style={{ width: "100%" }}>
                <Card.Meta
                  avatar={g.icon}
                  title={g.label}
                  description={
                    <>
                      <p>Точек: {g.totalPoints}</p>
                      <p>Суточный (л/сут): {Math.round(g.totalDailyLiters)}</p>
                    </>
                  }
                />
              </Card>
            )}
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default GasTable;
