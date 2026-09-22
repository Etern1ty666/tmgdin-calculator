import { CYLINDER_SIZES, FILL_PRESSURES, GAS_BY_ID } from './gases'
import { LIQUID_UNITS } from './calc'

const KEY = 'cylinders/config'

/*
 * Запоминаем только настройку оборудования, не само количество: газ, баллон
 * и единицы у человека изо дня в день одни, а цифра каждый раз своя.
 */

/** Приватный режим и заблокированные куки роняют доступ к хранилищу */
function safe(fn) {
  try {
    return fn()
  } catch {
    return null
  }
}

export function loadConfig() {
  const raw = safe(() => localStorage.getItem(KEY))
  if (!raw) return null

  const parsed = safe(() => JSON.parse(raw))
  if (!parsed || typeof parsed !== 'object') return null

  /* сохранённое могло устареть после смены списка газов или типоразмеров */
  const c = parsed
  const out = {}
  if (typeof c.gasId === 'string' && GAS_BY_ID[c.gasId]) out.gasId = c.gasId
  if (typeof c.cylinderVolume === 'number' && CYLINDER_SIZES.includes(c.cylinderVolume)) {
    out.cylinderVolume = c.cylinderVolume
  }
  if (typeof c.fillPressure === 'number' && FILL_PRESSURES.includes(c.fillPressure)) {
    out.fillPressure = c.fillPressure
  }
  if (LIQUID_UNITS.includes(c.liquidUnit)) out.liquidUnit = c.liquidUnit
  return Object.keys(out).length ? out : null
}

export function saveConfig(config) {
  safe(() => localStorage.setItem(KEY, JSON.stringify(config)))
}
