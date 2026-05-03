import { Settings } from "./types";

export const SETTINGS_LIMITS = {
	minClassesPerDay: 1,
	maxClassesPerDay: 10,
	minDaysPerWeek: 1,
	maxDaysPerWeek: 7,
	minClassesPerSubjectPerDay: 1,
} as const;

function clampNumber(value: number | undefined, min: number, max: number, fallback: number) {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return fallback;
	}

	return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function getMaxClassesPerSubjectPerDay(classesPerDay: number) {
	return classesPerDay * 2;
}

export function normalizeSettings(settings: Partial<Settings>, fallback?: Settings): Settings {
	const classesPerDay = clampNumber(
		settings.classesPerDay,
		SETTINGS_LIMITS.minClassesPerDay,
		SETTINGS_LIMITS.maxClassesPerDay,
		fallback?.classesPerDay ?? SETTINGS_LIMITS.minClassesPerDay,
	);
	const maxClassesPerSubjectPerDay = getMaxClassesPerSubjectPerDay(classesPerDay);

	return {
		classesPerDay,
		daysPerWeek: clampNumber(
			settings.daysPerWeek,
			SETTINGS_LIMITS.minDaysPerWeek,
			SETTINGS_LIMITS.maxDaysPerWeek,
			fallback?.daysPerWeek ?? SETTINGS_LIMITS.minDaysPerWeek,
		),
		maxClassesPerSubjectPerDay: clampNumber(
			settings.maxClassesPerSubjectPerDay,
			SETTINGS_LIMITS.minClassesPerSubjectPerDay,
			maxClassesPerSubjectPerDay,
			fallback?.maxClassesPerSubjectPerDay ?? SETTINGS_LIMITS.minClassesPerSubjectPerDay,
		),
		integralShiftPriority: settings.integralShiftPriority ?? fallback?.integralShiftPriority,
	};
}
