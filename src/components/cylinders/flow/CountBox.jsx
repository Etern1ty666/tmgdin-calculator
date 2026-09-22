import { fitDigits, MAX_CYLINDERS } from '../calc'
import { cylinders as pluralCylinders } from '../plural'

export function CountBox({ count, disabled, onChange, withTimes }) {
  const digits = Math.max(1, disabled || !Number.isFinite(count) ? 1 : String(count).length)
  const fit = fitDigits(count)

  return (
    /* знак и поле переносятся вместе — иначе × остаётся висеть у баллона */
    <span className="bc-flow__mult">
      {withTimes && (
        /* svg, а не «×»: у глифа чернила занимают половину строки и сидят низко,
           ровные отступы сверху и снизу текстом не получить */
        <span className="bc-flow__times" aria-hidden="true">
          <svg viewBox="0 0 10 10">
            <path d="M1 1l8 8M9 1l-8 8" />
          </svg>
        </span>
      )}
      <label className="bc-flow__countbox">
        <input
          className="bc-flow__count"
          style={{ width: `${digits}ch`, fontSize: fit }}
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_CYLINDERS}
          step={1}
          disabled={disabled}
          value={!disabled && Number.isFinite(count) ? count : ''}
          onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
          aria-label="Количество баллонов"
        />
        <span className="bc-flow__countunit">
          {/* ширину держит самая длинная форма: иначе коробка дышит на 1 / 2 / 5
              и точка переноса строки уезжает вместе с ней */}
          <span className="bc-flow__countghost" aria-hidden="true">
            баллонов
          </span>
          <span>{disabled ? 'баллонов' : pluralCylinders(count)}</span>
        </span>
      </label>
    </span>
  )
}
