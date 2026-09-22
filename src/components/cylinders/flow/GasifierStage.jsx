import { fitDigits, LIQUID_UNITS, LIQUID_UNIT_LABEL, MAX_LIQUID } from '../calc'
import { Gasifier } from '../Gasifier'

/** Бак с табличкой: количество жидкости и единицы прямо на нём */
export function GasifierStage({ gas, amount, unit, onAmount, onUnit }) {
  const shown = Number.isFinite(amount) ? String(amount) : ''
  /* поле по содержимому: иначе между числом и переключателем зияет пустота */
  const chars = Math.max(3, shown.length)

  return (
    <div className="bc-flow__stage">
      <Gasifier gas={gas} />
      <div className="bc-flow__plate">
        <input
          className="bc-flow__input"
          style={{ fontSize: fitDigits(amount), width: `${chars}ch` }}
          type="number"
          inputMode="decimal"
          min={0}
          max={MAX_LIQUID}
          step={0.1}
          value={Number.isFinite(amount) ? amount : ''}
          onChange={(e) => onAmount(e.target.value === '' ? NaN : Number(e.target.value))}
          aria-label="Количество жидкости в газификаторе"
        />
        <span className="bc-flow__units">
          {LIQUID_UNITS.map((u) => (
            <button
              key={u}
              type="button"
              className={u === unit ? 'bc-unit bc-unit--active' : 'bc-unit'}
              aria-pressed={u === unit}
              onClick={() => onUnit(u)}
            >
              {LIQUID_UNIT_LABEL[u]}
            </button>
          ))}
        </span>
      </div>
    </div>
  )
}
