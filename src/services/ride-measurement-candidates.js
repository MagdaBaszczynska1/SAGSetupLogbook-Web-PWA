import { SUSPENSION_TYPE } from "../models/suspension-type.js";
import { calendarDayDifference, getLocalDateKey } from "../utils/date-formatters.js";

export const RIDE_MEASUREMENT_GROUP = Object.freeze({
  SAME_DAY_BIKE: "sameDayBike",
  RECENT_BIKE: "recentBike",
  SAME_DAY_UNASSIGNED: "sameDayUnassigned"
});

function newestFirst(left, right) {
  const difference = new Date(right.date).getTime() - new Date(left.date).getTime();
  return difference || String(left.id).localeCompare(String(right.id));
}

function latestPerSuspension(measurements) {
  const selected = new Map();
  for (const measurement of [...measurements].sort(newestFirst)) {
    if (!selected.has(measurement.suspensionType)) selected.set(measurement.suspensionType, measurement);
  }
  return [...selected.values()];
}

function isSameDay(measurement, rideDate) {
  return getLocalDateKey(measurement.date) === getLocalDateKey(rideDate);
}

export function getRideMeasurementCandidates({ measurements, selectedBikeID, rideDate }) {
  const source = Array.isArray(measurements) ? measurements : [];
  const bikeID = selectedBikeID === null || selectedBikeID === undefined ? null : String(selectedBikeID);
  const validRideDate = getLocalDateKey(rideDate);
  if (!validRideDate || !bikeID) {
    return Object.freeze({ groups: Object.freeze([]), suggestedIDs: Object.freeze([]), allCandidates: Object.freeze([]) });
  }

  const sameDayBike = source
    .filter(measurement => String(measurement.bikeID) === bikeID && isSameDay(measurement, rideDate))
    .sort(newestFirst);

  const sameDayTypes = new Set(sameDayBike.map(measurement => measurement.suspensionType));
  const recentBike = [];
  for (const type of [SUSPENSION_TYPE.FORK, SUSPENSION_TYPE.SHOCK]) {
    if (sameDayTypes.has(type)) continue;
    const latest = source
      .filter(measurement => String(measurement.bikeID) === bikeID && measurement.suspensionType === type)
      .filter(measurement => {
        const difference = calendarDayDifference(rideDate, measurement.date);
        return difference !== null && difference >= 1 && difference <= 7;
      })
      .sort(newestFirst)[0];
    if (latest) recentBike.push(latest);
  }

  const sameDayUnassigned = source
    .filter(measurement => (measurement.bikeID === null || measurement.bikeID === undefined) && isSameDay(measurement, rideDate))
    .sort(newestFirst);

  const groups = [
    {
      id: RIDE_MEASUREMENT_GROUP.SAME_DAY_BIKE,
      title: "Pomiary tego roweru z dnia jazdy",
      description: "Najnowszy pomiar każdego typu jest zaznaczany automatycznie.",
      measurements: sameDayBike
    },
    {
      id: RIDE_MEASUREMENT_GROUP.RECENT_BIKE,
      title: "Ostatni brakujący typ z poprzednich 7 dni",
      description: "Starsze pomiary wymagają świadomego wyboru.",
      measurements: recentBike
    },
    {
      id: RIDE_MEASUREMENT_GROUP.SAME_DAY_UNASSIGNED,
      title: "Pomiary bez profilu z dnia jazdy",
      description: "Wybierz je tylko wtedy, gdy należą do tej jazdy.",
      measurements: sameDayUnassigned
    }
  ].filter(group => group.measurements.length > 0)
    .map(group => Object.freeze({ ...group, measurements: Object.freeze([...group.measurements]) }));

  const allCandidates = groups.flatMap(group => group.measurements);
  const suggestedIDs = latestPerSuspension(sameDayBike).map(measurement => measurement.id);

  return Object.freeze({
    groups: Object.freeze(groups),
    suggestedIDs: Object.freeze(suggestedIDs),
    allCandidates: Object.freeze(allCandidates)
  });
}

export function toggleRideMeasurementSelection({ selectedIDs, measurement, candidates }) {
  const current = new Set(selectedIDs ?? []);
  if (current.has(measurement.id)) {
    current.delete(measurement.id);
    return Object.freeze([...current]);
  }

  for (const candidate of candidates ?? []) {
    if (candidate.suspensionType === measurement.suspensionType) current.delete(candidate.id);
  }
  current.add(measurement.id);
  return Object.freeze([...current]);
}

export function measurementsForSelection(ids, candidates) {
  const byID = new Map((candidates ?? []).map(measurement => [measurement.id, measurement]));
  return [...new Set(ids ?? [])].map(id => byID.get(id)).filter(Boolean);
}
