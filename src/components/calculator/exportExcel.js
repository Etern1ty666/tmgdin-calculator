import ExcelJS from "exceljs";
import packageInfo from "../../../package.json";
import { buildCalculationReport } from "./exportReport";

const ink = "23364D";
const { version } = packageInfo;
const muted = "65758B";
const pale = "F2F5F9";
const line = "DFE5ED";
const numberFormat = value => Number.isInteger(value) ? '#,##0' : '#,##0.00';

function baseSheet(workbook, name, widths) {
  const sheet = workbook.addWorksheet(name, {
    views: [{ showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } },
  });
  sheet.columns = widths.map(width => ({ width }));
  sheet.properties.defaultRowHeight = 23;
  sheet.headerFooter.oddFooter = "&LТМГ ДИН&C&P / &N";
  return sheet;
}

function styleRow(row, width, { fill, bold = false, color = ink, height = 24 } = {}) {
  row.height = height;
  for (let i = 1; i <= width; i++) {
    const cell = row.getCell(i);
    cell.font = { name: "Arial", size: 10, bold, color: { argb: color } };
    cell.alignment = { vertical: "middle", horizontal: typeof cell.value === "number" ? "right" : cell.value === "—" ? "center" : "left", wrapText: true };
    if (fill) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
    cell.numFmt = numberFormat(cell.value);
  }
}

function spanRow(sheet, text, width, options) {
  const row = sheet.addRow([text]);
  styleRow(row, width, options);
  sheet.mergeCells(row.number, 1, row.number, width);
  return row;
}

function heading(sheet, title, date, width) {
  sheet.addRow([]).height = 8;
  const row = spanRow(sheet, title, width, { bold: true, height: 30 });
  row.getCell(1).font.size = 16;
  row.getCell(1).border = { bottom: { style: "thin", color: { argb: line } } };
  spanRow(sheet, `ТМГ ДИН · Версия ${version} · ${date.toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })} (МСК)`, width, { color: muted });
  sheet.addRow([]).height = 10;
}

export function createCalculationWorkbook(rooms, values, date = new Date()) {
  const report = buildCalculationReport(rooms, values);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "ТМГ ДИН";
  workbook.created = date;
  workbook.modified = date;
  workbook.title = "Расчёт медицинских газов";
  workbook.description = `Результаты и исходные данные калькулятора ТМГ ДИН ${version}`;

  const summary = baseSheet(workbook, "Расчеты", [24, 18, 16, 22, 22, 22]);
  summary.properties.tabColor = { argb: ink };
  heading(summary, "Расчёт медицинских газов", date, 6);
  report.warnings.forEach(warning => spanRow(summary, warning, 6, { fill: "FFF2D9", color: "865700", height: Math.max(32, Math.ceil(warning.length / 115) * 15 + 12) }));
  if (!report.sections.length) spanRow(summary, "Нет данных для экспорта. Укажите количество точек в калькуляторе.", 6);

  report.sections.forEach((section, index) => {
    if (index > 0) {
      summary.addRow([]).height = 16;
      summary.getRow(summary.rowCount).addPageBreak();
    }
    spanRow(summary, section.title, 6, { fill: section.color, bold: true, color: "FFFFFF", height: 30 });
    const header = summary.addRow(["Показатель", null, null, "Значение", "Единица", null]);
    styleRow(header, 6, { fill: pale, bold: true });
    summary.mergeCells(header.number, 1, header.number, 3);
    summary.mergeCells(header.number, 5, header.number, 6);
    [1, 4, 5].forEach(col => { header.getCell(col).alignment.horizontal = "center"; });
    section.metrics.forEach((metric, i) => {
      const row = summary.addRow([metric.label, null, null, metric.value, metric.unit, null]);
      styleRow(row, 6, { fill: i % 2 ? pale : "FFFFFF", height: 25 });
      summary.mergeCells(row.number, 1, row.number, 3);
      summary.mergeCells(row.number, 5, row.number, 6);
      row.getCell(5).alignment.horizontal = "center";
      if (metric.label.includes("концентратора")) {
        row.getCell(4).font = { ...row.getCell(4).font, bold: true, color: { argb: "288347" } };
      }
    });
    summary.addRow([]).height = 8;
    const equipmentHeader = summary.addRow(["Оборудование", null, null, "Основной", "Вторичный", "Аварийный / резервный"]);
    styleRow(equipmentHeader, 6, { fill: ink, bold: true, color: "FFFFFF", height: 32 });
    summary.mergeCells(equipmentHeader.number, 1, equipmentHeader.number, 3);
    [1, 4, 5, 6].forEach(col => { equipmentHeader.getCell(col).alignment.horizontal = "center"; });
    section.equipment.forEach((item, i) => {
      const row = summary.addRow([item.label, null, null, item.main, item.secondary, item.reserve ?? "—"]);
      styleRow(row, 6, { fill: i % 2 ? pale : "FFFFFF", height: 28 });
      summary.mergeCells(row.number, 1, row.number, 3);
      [4, 5, 6].forEach(col => {
        const cell = row.getCell(col);
        cell.numFmt = `${numberFormat(cell.value)} "${item.unit}"`;
      });
    });
    summary.addRow([]).height = 6;
    spanRow(summary, "Принятые допущения", 6, { bold: true, color: muted });
    section.notes.forEach(note => spanRow(summary, note, 6, { color: muted, height: Math.max(25, Math.ceil(note.length / 120) * 15 + 8) }));
  });
  summary.pageSetup.printArea = `A1:F${summary.rowCount}`;

  const inputs = baseSheet(workbook, "Исходные данные", [68, 28, 12, 19, 12, 16, 19, 13, 25]);
  heading(inputs, "Исходные данные по помещениям", date, 9);
  spanRow(inputs, "Снимок введённых точек и параметров. Итоги находятся на листе «Расчеты». Для Air 8 коэффициент K определяется по всему объекту.", 9, { color: muted });
  const inputHeader = inputs.addRow(["Помещение", "Газ", "Точки, шт", "Расход на точку, л/мин", "Коэфф. K", "Время, ч/сут", "Расход", "Единица", "Для концентратора, K = 1, л/сут"]);
  styleRow(inputHeader, 9, { fill: ink, bold: true, color: "FFFFFF", height: 44 });
  inputHeader.eachCell(cell => { cell.alignment.horizontal = "center"; });
  report.inputs.forEach((item, i) => {
    const row = inputs.addRow([item.room, item.gas, item.points, item.nominal ?? "—", item.factor ?? "—", item.hours ?? "—", item.flow ?? "—", item.unit, item.concentrator ?? "—"]);
    styleRow(row, 9, { fill: i % 2 ? pale : "FFFFFF", height: Math.max(28, Math.ceil(item.room.length / 60) * 14 + 10) });
    row.getCell(3).numFmt = '#,##0';
    row.getCell(8).alignment.horizontal = "center";
  });
  if (report.inputs.length) inputs.autoFilter = { from: { row: inputHeader.number, column: 1 }, to: { row: inputs.rowCount, column: 9 } };
  inputs.views = [{ state: "frozen", ySplit: inputHeader.number, xSplit: 2, showGridLines: false }];
  inputs.pageSetup.printTitlesRow = `1:${inputHeader.number}`;
  inputs.pageSetup.printArea = `A1:I${inputs.rowCount}`;
  return workbook;
}

export async function downloadCalculationWorkbook(rooms, values) {
  const date = new Date();
  const workbook = createCalculationWorkbook(rooms, values, date);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Расчеты — ${date.toLocaleDateString("sv-SE", { timeZone: "Europe/Moscow" })}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Дать браузеру начать скачивание до освобождения URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
