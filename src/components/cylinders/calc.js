export const P_ATM = 1.01325 // бар
export const T0 = 273.15 // K

/** Условия приведения объёма: 'normal' — 0 °C, 'standard' — 20 °C */
export const REF_TEMP = {
  normal: 273.15, // физические нормальные условия — 0 °C
  standard: 293.15, // ГОСТ 2939-63: к этим условиям приводят объём газа в расчётах с потребителем
}

export const REF_LABEL = {
  normal: '0 °C, 101,325 кПа',
  standard: '20 °C, 101,325 кПа',
}

/** Температура газа в баллоне, К — принята штатной */
const CYLINDER_TEMP = 293.15

/** Плотность газа при выбранных условиях приведения, кг/м³ */
export function densityAt(gas, ref) {
  return gas.density0 * (T0 / REF_TEMP[ref])
}

/** Линейная интерполяция коэффициента сжимаемости по таблице газа */
export function compressibility(gas, pressureBar) {
  const table = gas.z
  if (!table || table.length === 0) return 1
  const p = Math.max(0, pressureBar)
  if (p <= table[0][0]) return table[0][1]
  for (let i = 1; i < table.length; i++) {
    const [p1, z1] = table[i]
    if (p <= p1) {
      const [p0, z0] = table[i - 1]
      return z0 + ((z1 - z0) * (p - p0)) / (p1 - p0)
    }
  }
  return table[table.length - 1][1]
}

/**
 * Объём газа в баллоне при условиях приведения, м³.
 * Баллон всегда полный и при 20 °C, поэтому остальных параметров тут нет.
 */
function reduceVolume(gas, cylinderVolume, pressure, useZ, ref) {
  const z = useZ ? compressibility(gas, pressure) : 1
  const pAbs = pressure + P_ATM
  return ((cylinderVolume / 1000) * (pAbs / P_ATM) * (REF_TEMP[ref] / CYLINDER_TEMP)) / z
}

/* ===================== Жидкость ↔ баллоны =====================
 *
 * Задача: пересчёт наливной жидкости в количество баллонов и обратно.
 * Принимаем, что баллон всегда наполнен до нормы, жидкость и газ при
 * штатных условиях, потерь на газификацию и охлаждение нет.
 */

export const LIQUID_UNIT_LABEL = {
  kg: 'кг',
  l: 'л',
}

export const LIQUID_UNITS = ['l', 'kg']

/** Сколько газа в одном полном баллоне: по давлению заправки при 20 °C */
export function cylinderContent(gas, cylinderVolume, fillPressure, useZ, ref) {
  const volume = reduceVolume(gas, cylinderVolume, fillPressure, useZ, ref)
  return { volume, mass: volume * densityAt(gas, ref) }
}

/** Килограммы обратно в выбранную единицу — для второго поля конвертера */
export function kgToLiquid(kg, unit, bulkDensity) {
  if (!Number.isFinite(kg) || kg <= 0) return 0
  if (unit === 'kg') return kg
  return bulkDensity ? kg / bulkDensity : 0
}

/** Введённое количество жидкости в килограммы */
export function liquidToKg(amount, unit, bulkDensity) {
  if (!Number.isFinite(amount) || amount < 0) return 0
  if (unit === 'kg') return amount
  return bulkDensity ? amount * bulkDensity : 0
}

/** Разряды в больших числах: 1 791 вместо 1791 */
export function formatCount(value, digits = 0) {
  if (!Number.isFinite(value)) return '—'
  return value.toLocaleString('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/**
 * Потолок ввода. Реальный газификатор — это десятки тонн и тысячи баллонов;
 * всё, что выше, только ломает вёрстку, поэтому режем на входе.
 */
export const MAX_LIQUID = 999999
export const MAX_CYLINDERS = 99999

/** Введённое значение: пустое поле оставляем пустым, остальное зажимаем */
export function clampInput(value, max) {
  if (!Number.isFinite(value)) return NaN
  return Math.min(Math.max(value, 0), max)
}

/**
 * Поля фиксированной ширины, а пересчёт с одной стороны может дать семизначное
 * число. Крупный кегль оставляем короткому числу, длинное ужимаем.
 */
export function fitDigits(value) {
  if (!Number.isFinite(value)) return undefined
  const digits = String(Math.trunc(Math.abs(value))).length
  if (digits <= 4) return undefined
  if (digits === 5) return '0.84em'
  if (digits === 6) return '0.7em'
  return '0.58em'
}
