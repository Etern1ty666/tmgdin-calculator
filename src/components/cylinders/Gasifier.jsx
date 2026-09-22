
/**
 * Газификатор: вертикальный криоцилиндр и атмосферный испаритель рядом.
 * Табличка с количеством ложится поперёк всей установки, поэтому подгонять
 * ширину бака под неё не нужно — бак нарисован в своих пропорциях.
 */
export function Gasifier({ gas }) {
  const style = {
    '--gas': gas?.color ?? 'var(--border-strong)',
    '--gas-dark': gas?.colorDark ?? 'var(--border-strong)',
  }

  return (
    <svg
      viewBox="0 0 120 150"
      className={gas ? 'bc-gsf' : 'bc-gsf bc-gsf--nogas'}
      style={style}
      role="img"
      aria-label="Газификатор с жидкостью"
    >
      <rect className="bc-gsf__metal" x="15" y="124" width="10" height="22" rx="3" />
      <rect className="bc-gsf__metal" x="47" y="124" width="10" height="22" rx="3" />

      <rect className="bc-gsf__shell" x="2" y="6" width="68" height="126" rx="34" />
      <clipPath id="gsf-tank">
        <rect x="2" y="6" width="68" height="126" rx="34" />
      </clipPath>
      <g clipPath="url(#gsf-tank)">
        <rect className="bc-gsf__liquid" x="2" y="72" width="68" height="60" />
      </g>
      <rect className="bc-gsf__outline" x="2" y="6" width="68" height="126" rx="34" />

      {/* начало трубы лежит на дуге дна: центр (36, 98), радиус 34 → x≈65 при y=116 */}
      <path className="bc-gsf__pipe" d="M65 116h29" />

      <rect className="bc-gsf__evap" x="94" y="16" width="24" height="120" rx="6" />
      <path className="bc-gsf__fin" d="M100 24v104M106 24v104M112 24v104" />
    </svg>
  )
}
