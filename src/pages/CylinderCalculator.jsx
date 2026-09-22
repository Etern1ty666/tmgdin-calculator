import React from "react";
import { useCalculator } from "../components/cylinders/useCalculator";
import { Scheme } from "../components/cylinders/Scheme";
import "../components/cylinders/cylinders.css";

/**
 * Пересчёт наливной криогенной жидкости в баллоны и обратно.
 * Своя вёрстка, а не antd: схема с газификатором и полями прямо на оборудовании.
 * Всё заперто внутрь .bc, тему берёт из data-theme на <html>.
 */
export default function CylinderCalculator() {
  const calc = useCalculator();

  return (
    <div className="bc">
      <div className="bc-page">
        <main className="bc-card">
          <Scheme {...calc} />
        </main>
      </div>
    </div>
  );
}
