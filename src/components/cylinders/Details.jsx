import { compressibility, densityAt, formatCount, P_ATM, REF_LABEL } from './calc'
import { cylinders as pluralCylinders } from './plural'

function n(value, digits = 2) {
  return formatCount(value, digits)
}

/**
 * Разбор расчёта: формула с подставленными числами и константы того газа,
 * который выбран. Свёрнут по умолчанию — на экране нужен ответ, а не вывод.
 */
export function Details({ gas, state, derived }) {
  const { content, ready } = derived
  const volume = state.cylinderVolume
  const pressure = state.fillPressure
  if (!ready || !gas || !content || volume === null || pressure === null) return null

  const z = state.useZ ? compressibility(gas, pressure) : 1
  const rho = densityAt(gas, state.refConditions)
  const pAbs = pressure + P_ATM
  const bulk = gas.bulk?.density ?? null
  /* сколько литров газа даёт литр наливной жидкости — тот самый «коэффициент газификации» */
  const expansion = bulk ? (bulk / rho) * 1000 : null

  /* поле можно очистить, тогда cylinderField = NaN; само поле остаётся пустым,
     а всё, что его пересказывает, считает это нулём — иначе выходит «— баллонов» */
  const count = Number.isFinite(derived.cylinderField) ? derived.cylinderField : 0
  const cylinders = formatCount(count)
  const litres = formatCount(derived.liquidLitres, derived.liquidLitres < 100 ? 1 : 0)
  const cubic = formatCount(derived.totalGasVolume, derived.totalGasVolume < 100 ? 1 : 0)

  return (
    <>
      {/* строка итога живёт в summary и озвучивается как кнопка, поэтому
          результат повторяем отдельно для экранного диктора */}
      <p className="bc-sr" role="status" aria-live="polite">
        {gas.name}, баллон {volume} л на {pressure} бар: {litres} л жидкости, {cubic} м³ газа,{' '}
        {cylinders} {pluralCylinders(count)}
      </p>

      <details className="bc-calc">
      {/* итог сам и служит кнопкой: раскрывается то, что человек только что прочитал */}
      <summary className="bc-calc__sum">
        <span className="bc-calc__result">
          <span>{litres} л жидкости</span>
          <i>→</i>
          <span>{cubic} м³ газа</span>
        </span>
        <span className="bc-calc__more">подробнее</span>
      </summary>

      <div className="bc-calc__body">
        <section className="bc-calc__block">
          <h3 className="bc-calc__title">Газ в одном баллоне</h3>
          <p className="bc-calc__text">
            Баллон {volume} л — это вместимость по воде. Газ в нём сжат, поэтому объём считают через
            уравнение состояния, а поправка <b>Z</b> учитывает, что реальный газ при таком давлении
            сжимается не так, как идеальный.
          </p>
          {/* строки не длиннее 34 знаков: иначе блок уходит в прокрутку на 320 px */}
          <pre className="bc-calc__math">
            {`V = Vб/1000 × Pабс/1,013 ÷ Z
  = ${n(volume / 1000, 2)} × ${n(pAbs, 2)}/1,013 ÷ ${n(z, 3)}
  = ${n(content.volume, 2)} м³

m = V × ρ
  = ${n(content.volume, 2)} × ${n(rho, 4)}
  = ${n(content.mass, 2)} кг`}
          </pre>
        </section>

        <section className="bc-calc__block">
          <h3 className="bc-calc__title">Сколько баллонов</h3>
          <p className="bc-calc__text">
            Считаем через массу: она не зависит от температуры и давления, а объём зависит. Дробные
            баллоны отбрасываем — неполный баллон не отгружают.
          </p>
          <pre className="bc-calc__math">
            {`баллонов = ${n(derived.totalMass, 1)} кг ÷ ${n(content.mass, 2)} кг
         = ${n(derived.exactCylinders, 2)}
         → ${cylinders}`}
          </pre>
        </section>

        <section className="bc-calc__block">
          <h3 className="bc-calc__title">Условия приведения</h3>
          <p className="bc-calc__text">
            Кубометры газа указаны при <b>{REF_LABEL[state.refConditions]}</b>. Это условия
            по ГОСТ 2939-63, к ним в России приводят объём газа в расчётах с потребителем — не путать
            с физическими нормальными условиями при 0 °C, они дают объём на 7,3 % меньше.
          </p>
        </section>

        <section className="bc-calc__block">
          <h3 className="bc-calc__title">Что взято для этого газа</h3>
          <dl className="bc-calc__facts">
            <div>
              <dt>Плотность газа, 20 °C</dt>
              <dd>{n(rho, 4)} кг/м³</dd>
            </div>
            {bulk && (
              <div>
                <dt>Плотность жидкости, {gas.bulk?.at}</dt>
                <dd>{n(bulk, 3)} кг/л</dd>
              </div>
            )}
            {expansion && (
              <div>
                <dt>Из 1 л жидкости</dt>
                <dd>{n(expansion, 0)} л газа</dd>
              </div>
            )}
            <div>
              <dt>Z при {pressure} бар, 20 °C</dt>
              <dd>{n(z, 3)}</dd>
            </div>
            <div>
              <dt>Абсолютное давление</dt>
              <dd>{n(pAbs, 2)} бар</dd>
            </div>
          </dl>
          <p className="bc-calc__text">
            {gas.id === 'nitrogen'
              ? 'У азота Z больше единицы уже со 100 бар: он сжимается хуже идеального газа, и в баллон входит меньше, чем даёт расчёт без поправки.'
              : 'Z меньше единицы: газ сжимается лучше идеального, и в баллон входит больше, чем без поправки. Минимум приходится примерно на 150 бар, дальше Z растёт.'}
          </p>
        </section>

        <section className="bc-calc__block">
          <h3 className="bc-calc__title">Чего расчёт не учитывает</h3>
          <ul className="bc-calc__list">
            <li>
              Потери на газификацию, захолаживание оборудования и остаточное давление в баллоне.
              Фактический выход при заправке ниже расчётного примерно на 5–10 %.
            </li>
            <li>
              Баллоны по ГОСТ 949-73 рассчитаны на 14,7 и 19,6 МПа — это 150 и 200 кгс/см², то есть
              147,1 и 196,1 бар. Если на баллоне «150 атм» означает кгс/см², газа выйдет примерно
              на 2 % меньше.
            </li>
            <li>
              Жидкость в газификаторе под давлением теплее и легче, чем при температуре кипения:
              взята плотность при {gas.bulk?.at} и 1 атм.
            </li>
          </ul>
        </section>
      </div>
      </details>
    </>
  )
}
