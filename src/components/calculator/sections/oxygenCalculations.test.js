import { calculateConcentratorDemand } from "./oxygenCalculations";

const rooms = [
  { key: "operating", gases: [{ key: "oxygen", flowRate: 20, hoursPerDay: 5, usageFactor: 0.7 }] },
  { key: "general", gases: [{ key: "oxygen", flowRate: 4, hoursPerDay: 1.5, usageFactor: 0.3 }] },
  { key: "icu", gases: [{ key: "oxygen", flowRate: 8, hoursPerDay: 24, usageFactor: 1 }] },
];

test("uses K = 1 per room while preserving flow rates, points and working hours", () => {
  // 2 operating points: 12000; 10 general points: 3600; 1 ICU point: 11520.
  expect(calculateConcentratorDemand({
    rooms, values: { operating: { oxygen: 2 }, general: { oxygen: 10 }, icu: { oxygen: 1 } },
  })).toEqual({ totalLPerDay: 27120, avgLpm: 19, emergencyLpm: 2 });
});

test("does not divide by the configured factor, including when it is zero", () => {
  expect(calculateConcentratorDemand({
    rooms: [{ key: "custom", gases: [{ key: "oxygen", flowRate: 10, hoursPerDay: 24, usageFactor: 0 }] }],
    values: { custom: { oxygen: 2 } },
  })).toEqual({ totalLPerDay: 28800, avgLpm: 20, emergencyLpm: 2 });
});

test.each([
  ["hour", 12.5, { totalLPerDay: 18000, avgLpm: 12.5, emergencyLpm: 1 }],
  ["day", 1000, { totalLPerDay: 1000, avgLpm: 0.69, emergencyLpm: 0 }],
])("keeps manual input in %s units without applying another factor", (unit, value, expected) => {
  expect(calculateConcentratorDemand({
    rooms, values: { operating: { oxygen: 99 } },
    manualTotals: { oxygen: value }, manualUnits: { oxygen: unit },
  })).toEqual(expected);
});

test("ignores empty points, other gases and rooms without oxygen parameters", () => {
  expect(calculateConcentratorDemand({
    rooms: [...rooms, { key: "other", gases: [{ key: "air5" }] }],
    values: { operating: { oxygen: 0 }, general: { air5: 10 }, other: { oxygen: 3 }, removed: { oxygen: 99 } },
  })).toEqual({ totalLPerDay: 0, avgLpm: 0, emergencyLpm: 0 });
});
