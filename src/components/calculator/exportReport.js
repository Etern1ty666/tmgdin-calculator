import { calculateConcentratorDemand } from "./sections/oxygenCalculations";

const gasNames = {
  oxygen: "Кислород (O₂)", n2o: "Закись азота (N₂O)", co2: "Углекислый газ (CO₂)",
  air5: "Air 5 (0.4 МПа)", air8: "Air 8 (0.8 МПа)", agss: "AGSS", vacuum: "Вакуум",
};

export function getReportPipe(flow) {
  const diameter = Math.round(18.8 * Math.sqrt(flow * 60 / 1000 / 10) * 100) / 100;
  const sizes = [[8, 1], [12, 1], [15, 1], [18, 1], [22, 1], [28, 1], [35, 1.5], [42, 1.5]];
  const [outer, wall] = sizes.find(([d, w]) => diameter + 2 <= d - 2 * w)
    || [+(diameter + 2).toFixed(2), 1.5];
  return { diameter, outer, wall };
}

// Числа остаются числами: форматирование и единицы задаются при записи в Excel.
export function buildCalculationReport(rooms, values) {
  const inputs = [];
  const warnings = [];
  const totals = Object.fromEntries(Object.keys(gasNames).map(key => [key, { points: 0, rooms: 0, flow: 0 }]));
  const air8Points = rooms.reduce((sum, room) => sum + Number(values[room.key]?.air8 || 0), 0);
  const air8K = air8Points <= 1 ? 1 : air8Points <= 4 ? 0.7 : air8Points <= 6 ? 0.5 : 0.3;

  rooms.forEach(room => {
    const row = values[room.key] || {};
    const name = room.name || room.key;
    const hasAir = Number(row.air5 || 0) > 0 || Number(row.air8 || 0) > 0;
    if (Number(row.agss || 0) > 0 && !hasAir) warnings.push(`${name}: для AGSS не задан медицинский воздух (Air 5 или Air 8).`);
    if (Number(row.n2o || 0) > 0 && (!hasAir || !(Number(row.agss || 0) > 0))) {
      warnings.push(`${name}: для N₂O нужны AGSS и медицинский воздух (Air 5 или Air 8).`);
    }

    Object.entries(gasNames).forEach(([key, gas]) => {
      const points = Number(row[key] || 0);
      if (points <= 0) return;
      const params = room.gases?.find(g => g.key === key);
      if (!params && !["air8", "agss"].includes(key)) {
        warnings.push(`${name}, ${gas}: отсутствуют параметры расхода, строка не рассчитана.`);
        inputs.push({ room: name, gas, points, nominal: null, factor: null, hours: null, flow: null, unit: "—", concentrator: null });
        return;
      }
      const daily = ["oxygen", "n2o", "co2"].includes(key);
      const nominal = key === "air8" ? 350 : key === "agss" ? 50 : Number(params.flowRate ?? 0);
      const factor = key === "air8" ? air8K : key === "agss" ? 1 : Number(params.usageFactor ?? (key === "vacuum" ? 0.4 : 1));
      const hours = daily ? Number(params.hoursPerDay ?? 0) : null;
      const flow = nominal * points * factor * (daily ? hours * 60 : 1);
      totals[key].points += points;
      totals[key].rooms++;
      totals[key].flow += flow;
      inputs.push({ room: name, gas, points, nominal, factor, hours, flow,
        unit: daily ? "л/сут" : "л/мин",
        concentrator: key === "oxygen" ? nominal * points * hours * 60 : null,
      });
    });
  });

  const sections = [];
  const metric = (label, value, unit) => ({ label, value, unit });
  const counts = total => [metric("Количество помещений", total.rooms, "шт"), metric("Количество точек", total.points, "шт")];
  const pipe = (label, flow, fixedAgss = false, allowZero = false) => {
    if (flow <= 0 && !allowZero) return [];
    // AGSS на карточке имеет фиксированную трубу ⌀15.
    const p = fixedAgss ? { outer: 15, wall: 1, diameter: 13 } : getReportPipe(flow);
    return [metric(`${label}: наружный диаметр`, p.outer, "мм"),
      metric(`${label}: ${fixedAgss ? "внутренний диаметр" : "расчётный внутренний диаметр"}`, p.diameter, "мм"),
      metric(`${label}: толщина стенки`, p.wall, "мм")];
  };
  const equipment = (label, main, secondary, reserve, unit) => ({ label, main, secondary, reserve, unit });
  const oxygen = totals.oxygen;
  if (oxygen.points > 0) {
    const c = calculateConcentratorDemand({ rooms, values });
    sections.push({ title: gasNames.oxygen, color: "4282D3",
      metrics: [...counts(oxygen), metric("Суточный расход", oxygen.flow, "л/сут"),
        metric("Средний расход", Math.round(oxygen.flow / 1440), "л/мин"),
        metric("Суточный расход для концентратора (K = 1)", c.totalLPerDay, "л/сут"),
        metric("Средний расход для концентратора (K = 1)", c.avgLpm, "л/мин"),
        ...pipe("Труба кислорода", Math.round(oxygen.flow / 1440), false, true)],
      equipment: [
        equipment("Газификатор", +(oxygen.flow / 1000 * 5 / 860).toFixed(2), +(oxygen.flow / 1000 * 5 / 860).toFixed(2), +(oxygen.flow / 1000 * 0.1 / 860).toFixed(2), "м³"),
        equipment("Рампа (баллоны)", Math.max(1, Math.ceil(oxygen.flow * 3 / 6000)), Math.max(1, Math.ceil(oxygen.flow * 3 / 6000)), Math.max(1, Math.ceil(oxygen.flow * 0.1 / 6000)), "шт"),
        equipment("Концентратор (K = 1)", c.avgLpm, c.avgLpm, c.emergencyLpm, "л/мин"),
      ],
      notes: ["Расход: Σ(Vм × N × K × t × 60). Средний расход: л/сут ÷ 1440.",
        "Концентратор: K = 1 для каждого помещения, часы работы сохраняются. Аварийный расход: 0.1 суточного расхода ÷ 1440.",
        "Газификатор: запас 5 сут для основного и вторичного, 0.1 сут для аварийного. 1 м³ жидкого O₂ ≈ 860 м³ газа.",
        "Баллоны: запас 3 сут для основного и вторичного, 0.1 сут для аварийного (не менее 1 баллона). 1 баллон 40 л / 15 МПа ≈ 6000 л газа."],
    });
  }
  const air5 = totals.air5, air8 = totals.air8, agss = totals.agss;
  if (air5.points + air8.points + agss.points > 0) {
    const air = air5.flow + air8.flow;
    const all = air + agss.flow;
    const roomCount = rooms.filter(room => ["air5", "air8", "agss"].some(key => Number(values[room.key]?.[key] || 0) > 0)).length;
    sections.push({ title: "Воздух / AGSS", color: "B85F10",
      metrics: [metric("Количество помещений", roomCount, "шт"), metric("Количество точек (Air 5 + Air 8 + AGSS)", air5.points + air8.points + agss.points, "шт"),
        metric("Общий расход с AGSS", Math.round(all), "л/мин"),
        metric("Air 5: расход", Math.round(air5.flow), "л/мин"), metric("Air 5: количество точек", air5.points, "шт"),
        metric("Air 8: расход", Math.round(air8.flow), "л/мин"), metric("Air 8: количество точек", air8.points, "шт"),
        ...(air8.points ? [metric("Air 8: коэффициент одновременности K", air8K, "—")] : []),
        metric("Расход без AGSS (Air 5 + Air 8)", Math.round(air), "л/мин"),
        metric("AGSS: расход", Math.round(agss.flow), "л/мин"), metric("AGSS: расход в м³/ч", agss.flow * 60 / 1000, "м³/ч"),
        metric("AGSS: количество точек", agss.points, "шт"),
        ...pipe("Труба Air 5", air5.flow), ...pipe("Труба Air 8", air8.flow), ...pipe("Труба AGSS", agss.flow, true)],
      equipment: [equipment("Компрессор с учётом AGSS", Math.round(all), Math.round(all), Math.round(all), "л/мин"),
        equipment("Станция отвода AGSS", Math.round(agss.flow), Math.round(agss.flow), Math.round(agss.flow), "л/мин"),
        equipment("Компрессор без учёта AGSS", Math.round(air), Math.round(air), Math.round(air), "л/мин")],
      notes: ["Air 5: Σ(Vм × N × K). Air 8: 350 × суммарное N × K (л/мин).",
        "Air 8: K = 1 при 1 точке; 0.7 при 2–4; 0.5 при 5–6; 0.3 при 7 и более (как в калькуляторе).",
        "AGSS: 1 точка = 3 м³/ч = 50 л/мин. Труба AGSS: ⌀15 мм, стенка 1 мм, внутренний диаметр 13 мм.",
        "Основной, вторичный и резервный комплекты обеспечивают полную производительность каждый."],
    });
  }
  ["co2", "n2o"].forEach(key => {
    const total = totals[key];
    if (!total.points) return;
    const volume = key === "co2" ? 6000 : 3000;
    const cylinders = Math.ceil(total.flow / volume);
    const avg = Math.round(total.flow / 1440);
    sections.push({ title: gasNames[key], color: key === "co2" ? "596579" : "288347",
      metrics: [...counts(total), metric("Суточный расход", Math.round(total.flow), "л/сут"), metric("Средний расход", avg, "л/мин"), ...pipe("Труба", avg, false, true)],
      equipment: [equipment("Рампа (баллоны)", cylinders, cylinders, null, "шт")],
      notes: ["Расход: Σ(Vм × N × K × t × 60). Средний расход: л/сут ÷ 1440.",
        key === "co2" ? "1 баллон CO₂ 40 л / 15 МПа ≈ 6000 л газа." : "1 баллон N₂O 10 л / 6 МПа ≈ 3000 л газа.",
        "Две рампы с суточным запасом каждая. Отдельный аварийный источник не рассчитывается. Потери при переключении и продувке не учитываются."],
    });
  });
  const vacuum = totals.vacuum;
  if (vacuum.points) sections.push({ title: gasNames.vacuum, color: "BB3F58",
    metrics: [...counts(vacuum), metric("Суммарный расход", Math.round(vacuum.flow), "л/мин"), metric("В пересчёте", vacuum.flow * 60 / 1000, "м³/ч"), ...pipe("Труба вакуума", vacuum.flow, false, true)],
    equipment: [equipment("Компрессор", Math.round(vacuum.flow), Math.round(vacuum.flow), Math.round(vacuum.flow), "л/мин")],
    notes: ["Расход: Σ(Vм × N × K). Коэффициент K берётся из параметров помещения (по умолчанию 0.4).",
      "Три компрессора, каждый обеспечивает полную производительность. Пусковые и переходные режимы не учитываются."],
  });
  return { sections, inputs, warnings };
}
