import { Details } from './Details'
import { GasChips } from './GasChips'
import { CountBox } from './flow/CountBox'
import { CylinderStage } from './flow/CylinderStage'
import { GasifierStage } from './flow/GasifierStage'

/**
 * Естественное отображение (Норман): интерфейс повторяет физику процесса.
 * Слева газификатор с жидкостью, справа баллоны, между ними поток.
 * Количество жидкости вводится на баке, параметры баллона — на баллоне.
 */
export function Scheme({ state, gas, derived, set, selectGas, setLiquid, setUnit, setCylinders }) {
  const ready = derived.ready

  return (
    <div className="bc-view">
      <GasChips selected={state.gasId} onSelect={selectGas} />

      <div className="bc-flow">
        <span className="bc-flow__cap bc-flow__cap--left">Газификатор</span>
        <span className="bc-flow__cap bc-flow__cap--right">Баллоны</span>

        <div className="bc-flow__art bc-flow__art--left">
          <GasifierStage
            gas={gas}
            amount={derived.liquidField}
            unit={state.liquidUnit}
            onAmount={setLiquid}
            onUnit={setUnit}
          />
        </div>

        {/* линия тянется по свободному месту, наконечники фиксированные.
            Их два: вписывать можно в любое из полей, счёт идёт в обе стороны */}
        <div className="bc-flow__link" aria-hidden="true">
          <svg viewBox="0 0 12 16" className="bc-flow__head bc-flow__head--back">
            <path
              d="M10 2L2 8l8 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="bc-flow__line" />
          <svg viewBox="0 0 12 16" className="bc-flow__head">
            <path
              d="M2 2l8 6-8 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="bc-flow__art bc-flow__art--right">
          <CylinderStage
            gas={gas}
            volume={state.cylinderVolume}
            pressure={state.fillPressure}
            onVolume={(v) => set('cylinderVolume', v)}
            onPressure={(p) => set('fillPressure', p)}
          />
          <CountBox count={derived.cylinderField} disabled={!ready} onChange={setCylinders} withTimes />
        </div>
      </div>

      <Details gas={gas} state={state} derived={derived} />
    </div>
  )
}
