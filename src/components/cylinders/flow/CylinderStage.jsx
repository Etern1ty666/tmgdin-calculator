import { CYLINDER_SIZES, FILL_PRESSURES } from '../gases'
import { CylinderIcon } from '../CylinderIcon'

/** С двумя вариантами переключение по клику понятнее выпадающего списка */
function nextOf(options, current) {
  return current === null ? options[0] : options[(options.indexOf(current) + 1) % options.length]
}

/* без этого значка шильдик читается как напечатанная маркировка, а не кнопка */
function Caret() {
  return (
    <svg className="bc-spec__caret" viewBox="0 0 8 5" aria-hidden="true">
      <path d="M1 1l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/** Баллон с кликабельными объёмом и давлением прямо на корпусе */
export function CylinderStage({ gas, volume, pressure, onVolume, onPressure }) {
  return (
    <div className="bc-flow__stage">
      <CylinderIcon gas={gas} />
      <div className="bc-flow__specs">
        <button
          type="button"
          className={volume === null ? 'bc-spec bc-spec--unset' : 'bc-spec'}
          onClick={() => onVolume(nextOf(CYLINDER_SIZES, volume))}
          title="Переключить объём баллона"
        >
          {volume === null ? '— л' : `${volume} л`}
          <Caret />
        </button>
        <button
          type="button"
          className={pressure === null ? 'bc-spec bc-spec--unset' : 'bc-spec'}
          onClick={() => onPressure(nextOf(FILL_PRESSURES, pressure))}
          title="Переключить давление заправки"
        >
          {pressure === null ? '— бар' : `${pressure} бар`}
          <Caret />
        </button>
      </div>
    </div>
  )
}
