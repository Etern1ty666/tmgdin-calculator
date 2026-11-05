// Для концентратора коэффициент использования каждого помещения равен 1.
// Номинальные расходы и часы работы помещений сохраняются.
export function calculateConcentratorDemand({
  values = {}, rooms = [], manualTotals = {}, manualUnits = {},
}) {
  const manualValue = Number(manualTotals.oxygen || 0);
  const hasManual = manualValue > 0;
  const totalLPerDay = hasManual
    ? manualValue * (manualUnits.oxygen === "day" ? 1 : 1440)
    : rooms.reduce((total, room) => {
        const points = Number(values[room.key]?.oxygen || 0);
        const params = room.gases?.find((gas) => gas.key === "oxygen");
        if (points <= 0 || !params) return total;
        return total + Number(params.flowRate ?? 0) * points * Number(params.hoursPerDay ?? 0) * 60;
      }, 0);

  return {
    totalLPerDay,
    avgLpm: hasManual
      ? (manualUnits.oxygen === "day" ? +(manualValue / 1440).toFixed(2) : manualValue)
      : Math.round(totalLPerDay / 1440),
    emergencyLpm: Math.round(totalLPerDay * 0.1 / 1440),
  };
}
