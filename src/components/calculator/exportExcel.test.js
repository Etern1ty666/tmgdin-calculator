import ExcelJS from "exceljs";
import { rooms } from "../../data";
import { buildCalculationReport } from "./exportReport";
import { createCalculationWorkbook } from "./exportExcel";

const selected = rooms.filter(room => ["operating", "icu_adults"].includes(room.key));
const values = {
  operating: { oxygen: 2, n2o: 2, co2: 1, air5: 2, air8: 2, agss: 2, vacuum: 2 },
  icu_adults: { oxygen: 1, air8: 1 },
};
const findMetric = (section, label) => section.metrics.find(metric => metric.label === label)?.value;

test("exports all seven gases, separate air lines, equipment, pipes and source parameters", () => {
  const report = buildCalculationReport(selected, values);
  expect(report.sections).toHaveLength(5);
  expect(report.inputs).toHaveLength(9);
  expect(report.warnings).toEqual([]);
  const oxygen = report.sections[0];
  // 2 × 20 × 0.7 × 5 × 60 + 8 × 24 × 60
  expect(findMetric(oxygen, "Суточный расход")).toBe(19920);
  expect(findMetric(oxygen, "Суточный расход для концентратора (K = 1)")).toBe(23520);
  expect(oxygen.equipment.find(item => item.label === "Концентратор (K = 1)")).toMatchObject({ main: 16, secondary: 16, reserve: 2 });
  const air = report.sections[1];
  expect(findMetric(air, "Air 5: расход")).toBe(84);
  expect(findMetric(air, "Air 8: расход")).toBe(735);
  expect(findMetric(air, "Air 8: коэффициент одновременности K")).toBe(0.7);
  expect(findMetric(air, "AGSS: расход")).toBe(100);
  expect(findMetric(air, "AGSS: расход в м³/ч")).toBe(6);
  expect(findMetric(air, "Общий расход с AGSS")).toBe(919);
  expect(findMetric(air, "Труба Air 5: наружный диаметр")).toBe(18);
  expect(findMetric(air, "Труба Air 8: наружный диаметр")).toBe(41.48);
  expect(findMetric(air, "Труба AGSS: наружный диаметр")).toBe(15);
  expect(findMetric(air, "Труба AGSS: внутренний диаметр")).toBe(13);
  expect(report.sections.find(section => section.title.includes("CO₂")).equipment[0]).toMatchObject({ main: 1, secondary: 1, reserve: null });
  expect(report.sections.find(section => section.title.includes("N₂O")).equipment[0]).toMatchObject({ main: 1, secondary: 1, reserve: null });
  expect(findMetric(report.sections[4], "Суммарный расход")).toBe(56);
  expect(report.inputs.find(input => input.gas === "Air 8 (0.8 МПа)")).toMatchObject({ nominal: 350, factor: 0.7 });
});

test.each([[1, 1], [2, 0.7], [4, 0.7], [5, 0.5], [6, 0.5], [7, 0.3], [10, 0.3], [11, 0.3]])("Air 8 with %i points uses K = %f", (points, factor) => {
  const report = buildCalculationReport(selected, { operating: { air8: points } });
  expect(findMetric(report.sections[0], "Air 8: коэффициент одновременности K")).toBe(factor);
});

test("includes the same missing-system warnings as the calculator", () => {
  const report = buildCalculationReport(selected, { operating: { n2o: 1, agss: 1 } });
  expect(report.warnings).toHaveLength(2);
  expect(report.warnings[0]).toContain("Air 5 или Air 8");
  expect(report.warnings[1]).toContain("N₂O");
});

test("ignores removed rooms and handles empty input and missing parameters", () => {
  expect(buildCalculationReport(selected, { removed: { oxygen: 10 } })).toEqual({ sections: [], inputs: [], warnings: [] });
  const report = buildCalculationReport([{ key: "custom", name: "Без параметров" }], { custom: { oxygen: 1 } });
  expect(report.inputs[0].flow).toBeNull();
  expect(report.warnings).toHaveLength(1);
});

test("saved XLSX preserves numeric values, styles, units, source filters and frozen headers", async () => {
  const workbook = createCalculationWorkbook(selected, values, new Date("2026-11-05T16:00:00Z"));
  const saved = await workbook.xlsx.writeBuffer();
  const loaded = new ExcelJS.Workbook();
  await loaded.xlsx.load(saved);
  expect(loaded.worksheets.map(sheet => sheet.name)).toEqual(["Расчеты", "Исходные данные"]);
  const summary = loaded.getWorksheet("Расчеты");
  const rows = [];
  summary.eachRow(row => rows.push(row));
  const daily = rows.find(row => row.getCell(1).value === "Суточный расход");
  expect(daily.getCell(4).value).toBe(19920);
  expect(daily.getCell(5).value).toBe("л/сут");
  const equipment = rows.find(row => row.getCell(1).value === "Концентратор (K = 1)");
  expect(equipment.getCell(4).value).toBe(16);
  expect(equipment.getCell(4).numFmt).toContain('"л/мин"');
  const heading = rows.find(row => row.getCell(1).value === "Кислород (O₂)");
  expect(heading.getCell(1).fill.fgColor.argb).toBe("4282D3");
  expect(summary.pageSetup.fitToWidth).toBe(1);
  const inputs = loaded.getWorksheet("Исходные данные");
  expect(inputs.autoFilter).toBeTruthy();
  expect(inputs.views[0]).toMatchObject({ state: "frozen", xSplit: 2, ySplit: 6, showGridLines: false });
  expect(inputs.rowCount).toBe(15);
  expect(inputs.getCell("C7").value).toBe(2);
  expect(inputs.getCell("I7").value).toBe(12000);
});
