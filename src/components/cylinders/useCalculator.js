import { useCallback, useEffect, useMemo, useState } from 'react'
import { GAS_BY_ID } from './gases'
import {
  clampInput,
  cylinderContent,
  densityAt,
  kgToLiquid,
  liquidToKg,
  MAX_CYLINDERS,
  MAX_LIQUID,
} from './calc'
import { loadConfig, saveConfig } from './storage'

/** Экран открывается посчитанным: один баллон кислорода 40 л на 150 бар */
const INITIAL = {
  gasId: 'oxygen',
  cylinderVolume: 40,
  fillPressure: 150,
  liquidAmount: 1000,
  liquidUnit: 'kg',
  cylinderCount: 1,
  /** какое поле человек трогал последним — то и считается заданным */
  source: 'cylinders',
  useZ: true,
  refConditions: 'standard',
}

export function useCalculator() {
  /* настройку читаем один раз при первом рендере, количество всегда стартовое */
  const [state, setState] = useState(() => ({ ...INITIAL, ...loadConfig() }))

  useEffect(() => {
    saveConfig({
      gasId: state.gasId ?? INITIAL.gasId,
      cylinderVolume: state.cylinderVolume ?? INITIAL.cylinderVolume,
      fillPressure: state.fillPressure ?? INITIAL.fillPressure,
      liquidUnit: state.liquidUnit,
    })
  }, [state.gasId, state.cylinderVolume, state.fillPressure, state.liquidUnit])

  const gas = state.gasId ? GAS_BY_ID[state.gasId] : null
  const bulk = gas?.bulk?.density ?? null

  const set = useCallback((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const selectGas = useCallback((id) => {
    setState((prev) => (GAS_BY_ID[id] ? { ...prev, gasId: id } : prev))
  }, [])

  const setLiquid = useCallback((value) => {
    setState((prev) => ({ ...prev, liquidAmount: clampInput(value, MAX_LIQUID), source: 'liquid' }))
  }, [])

  const setCylinders = useCallback((value) => {
    setState((prev) => ({
      ...prev,
      cylinderCount: Math.floor(clampInput(value, MAX_CYLINDERS)),
      source: 'cylinders',
    }))
  }, [])

  /** При смене единицы физическое количество сохраняем, меняем только число */
  const setUnit = useCallback(
    (unit) => {
      setState((prev) => {
        if (unit === prev.liquidUnit) return prev
        if (prev.source !== 'liquid') return { ...prev, liquidUnit: unit }
        const kg = liquidToKg(prev.liquidAmount, prev.liquidUnit, bulk)
        const next = round(kgToLiquid(kg, unit, bulk))
        return { ...prev, liquidUnit: unit, liquidAmount: clampInput(next, MAX_LIQUID) }
      })
    },
    [bulk],
  )

  const derived = useMemo(() => {
    const { cylinderVolume, fillPressure } = state
    const ready = gas !== null && cylinderVolume !== null && fillPressure !== null
    if (!ready) {
      return {
        ready: false,
        content: null,
        liquidField: state.source === 'liquid' ? state.liquidAmount : 0,
        cylinderField: state.source === 'cylinders' ? state.cylinderCount : 0,
        exactCylinders: 0,
        totalMass: 0,
        totalGasVolume: 0,
        liquidLitres: 0,
      }
    }

    const content = cylinderContent(gas, cylinderVolume, fillPressure, state.useZ, state.refConditions)

    const totalMass =
      state.source === 'liquid'
        ? liquidToKg(state.liquidAmount, state.liquidUnit, bulk)
        : Math.max(0, Number.isFinite(state.cylinderCount) ? state.cylinderCount : 0) * content.mass

    const exactCylinders = content.mass > 0 ? totalMass / content.mass : 0

    return {
      ready: true,
      content,
      liquidField:
        state.source === 'liquid'
          ? state.liquidAmount
          : round(kgToLiquid(totalMass, state.liquidUnit, bulk)),
      /* запас 1e-9 гасит потерю точности: 120 баллонов иначе дают 119,9999 */
      cylinderField: state.source === 'cylinders' ? state.cylinderCount : Math.floor(exactCylinders + 1e-9),
      exactCylinders,
      totalMass,
      totalGasVolume: totalMass / densityAt(gas, state.refConditions),
      liquidLitres: bulk ? totalMass / bulk : 0,
    }
  }, [gas, state, bulk])

  return { state, gas, derived, set, selectGas, setLiquid, setCylinders, setUnit }
}

/**
 * Пока величина мала — с десятыми. Если округлять до целых, обратный ход теряет
 * точность: на баллон нужно 9,08 л, округлилось бы до 9 л, а этого уже не хватает.
 */
function round(value) {
  if (!Number.isFinite(value)) return 0
  return value < 100 ? Number(value.toFixed(1)) : Math.round(value)
}
