import React from "react";
import { Table, Typography } from "antd";
import { rooms } from "../../data";

const { Text } = Typography;

/**
 * Универсальная таблица нормативных параметров по типам помещений.
 * @param {string} gasKey - ключ газа (например, 'oxygen', 'vacuum', 'air5')
 */
export default function GasDocsTable({ gasKey }) {
  // Берём только помещения, где указан нужный газ
  const filteredRooms = rooms
    .filter((room) => room.gases.some((g) => g.key === gasKey))
    .map((room) => {
      const gas = room.gases.find((g) => g.key === gasKey);
      return {
        key: room.key,
        name: room.name,
        ...gas,
      };
    });

  if (filteredRooms.length === 0)
    return (
      <Text type="secondary">
        Нет данных о расходе для выбранного газа ({gasKey}).
      </Text>
    );

  // Проверяем, какие поля реально есть в данных
  const hasFlowRate = filteredRooms.some((r) => r.flowRate !== undefined);
  const hasHours = filteredRooms.some((r) => r.hoursPerDay !== undefined);
  const hasUsageFactor = filteredRooms.some((r) => r.usageFactor !== undefined);

  // Динамически формируем колонки
  const columns = [
    {
      title: "Помещение",
      dataIndex: "name",
      key: "name",
      width: "45%",
      render: (text) => <Text strong>{text}</Text>,
    },
    ...(hasFlowRate
      ? [
          {
            title: "Расход, л/мин",
            dataIndex: "flowRate",
            key: "flowRate",
            align: "center",
          },
        ]
      : []),
    ...(hasHours
      ? [
          {
            title: "Время, ч/сут",
            dataIndex: "hoursPerDay",
            key: "hoursPerDay",
            align: "center",
          },
        ]
      : []),
    ...(hasUsageFactor
      ? [
          {
            title: "Коэф. использования",
            dataIndex: "usageFactor",
            key: "usageFactor",
            align: "center",
          },
        ]
      : []),
  ];

  return (
    <Table
      dataSource={filteredRooms}
      columns={columns}
      size="small"
      pagination={false}
      bordered
      style={{ marginTop: 8 }}
      rowKey="key"
    />
  );
}
