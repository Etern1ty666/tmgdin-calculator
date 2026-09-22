import { GASES } from './gases'

function gasStyle(gas) {
  return {
    '--gas': gas.color,
    '--gas-dark': gas.colorDark,
    '--gas-ink': gas.ink === 'dark' ? '#15181c' : '#ffffff',
  }
}

export function GasChips({ selected, onSelect }) {
  return (
    <div className="bc-gchips">
      {GASES.map((gas) => {
        const active = gas.id === selected
        return (
          <button
            key={gas.id}
            type="button"
            className={active ? 'bc-gchip bc-gchip--active' : 'bc-gchip'}
            style={gasStyle(gas)}
            aria-pressed={active}
            onClick={() => onSelect(gas.id)}
          >
            <span className="bc-gchip__top">
              <span className="bc-gchip__dot" />
              <span className="bc-gchip__formula">{gas.formula}</span>
            </span>
            <span className="bc-gchip__name">{gas.name}</span>
          </button>
        )
      })}
    </div>
  )
}
