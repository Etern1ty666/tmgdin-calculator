/* viewBox обрезан по корпусу: прозрачные поля по бокам мешали центрировать «×» */
const BODY =
  'M8 190 L8 62 C8 36 21 25 40 25 C59 25 72 36 72 62 L72 190 Q72 197 65 197 L15 197 Q8 197 8 190 Z'

/**
 * Баллон в цвете газа. Маркировку не рисуем: объём и давление кладут поверх
 * кликабельными кнопками, иначе их нельзя было бы менять.
 */
export function CylinderIcon({ gas }) {
  const style = {
    '--gas': gas?.color ?? 'var(--border-strong)',
    '--gas-dark': gas?.colorDark ?? 'var(--border-strong)',
    '--gas-ink': gas?.ink === 'dark' ? '#15181c' : '#ffffff',
  }

  return (
    <svg
      viewBox="6 0 68 200"
      className={gas ? 'bc-cyl' : 'bc-cyl bc-cyl--nogas'}
      style={style}
      role="img"
      aria-label={gas ? `Баллон, ${gas.name}` : 'Баллон'}
    >
      <rect className="bc-cyl__paint" x="24" y="2" width="32" height="7" rx="3.5" />
      <rect className="bc-cyl__paint" x="33" y="8" width="14" height="22" rx="3" />
      <path className="bc-cyl__paint" d={BODY} />
      <path className="bc-cyl__shade" d="M8 190 L8 62 C8 36 21 25 40 25 L40 197 L15 197 Q8 197 8 190 Z" />

      {gas && (
        <text className="bc-cyl__formula" x="40" y="68" textAnchor="middle">
          {gas.formula}
        </text>
      )}

      <path className="bc-cyl__outline" d={BODY} />
    </svg>
  )
}
