import { TimetableClassroomResult, TimetableSlot, TimetableState } from "./types";
import { normalizeSettings } from "./settingsLimits";

export function generateTimetable(state: TimetableState) {
	const { classrooms, teachers } = state;
	const settings = normalizeSettings(state.settings);
	const { daysPerWeek, classesPerDay, maxClassesPerSubjectPerDay = 2 } = settings; // classesPerDay is per shift

	const timetable: TimetableClassroomResult[] = []; // the resulting 3D grid

	// Track teacher availability globally across all classrooms
	const teacherSchedule: Record<string, boolean[][]> = {};
	for (const t of teachers) {
		teacherSchedule[t.id] = [];
		for (let d = 0; d < daysPerWeek; d++) {
			teacherSchedule[t.id][d] = [];
			// Cover both morning and afternoon periods
			for (let period = 0; period < classesPerDay * 2; period++) {
				teacherSchedule[t.id][d][period] = false; // false means available
			}
		}

		// Also pre-mark unavailable constraints if any
		if (t.unavailableConstraints) {
			for (const constraint of t.unavailableConstraints) {
				if (constraint.dayOfWeek < daysPerWeek) {
					for (const p of constraint.periods) {
						if (p < classesPerDay * 2) {
							teacherSchedule[t.id][constraint.dayOfWeek][p] = true; // true means busy
						}
					}
				}
			}
		}
	}

	for (const c of classrooms) {
		const classroomSchedule: (TimetableSlot | null)[][] = [];

		let totalPeriods = classesPerDay;
		const passes: { start: number, end: number }[] = [];

		if (c.shift === 'Tarde') {
			totalPeriods = classesPerDay * 2;
			passes.push({ start: classesPerDay, end: classesPerDay * 2 });
		} else if (c.shift === 'Integral') {
			totalPeriods = classesPerDay * 2;
			if (settings.integralShiftPriority === 'Tarde') {
				passes.push({ start: classesPerDay, end: classesPerDay * 2 });
				passes.push({ start: 0, end: classesPerDay });
			} else {
				passes.push({ start: 0, end: classesPerDay });
				passes.push({ start: classesPerDay, end: classesPerDay * 2 });
			}
		} else {
			// Manhã
			passes.push({ start: 0, end: classesPerDay });
		}

		for (let d = 0; d < daysPerWeek; d++) {
			classroomSchedule[d] = [];
			for (let period = 0; period < totalPeriods; period++) {
				classroomSchedule[d][period] = null;
			}
		}

		const missingClasses: { subjectId: string, count: number }[] = [];

		for (const currentSubj of c.subjects) {
			let needed = currentSubj.weeklyClasses;

			const capableTeachers = teachers.filter(t => t.allowedSubjectIds.includes(currentSubj.subjectId));

			capableTeachers.sort((a, b) => {
				let pA = a.subjectPriorityIds?.indexOf(currentSubj.subjectId) ?? -1;
				let pB = b.subjectPriorityIds?.indexOf(currentSubj.subjectId) ?? -1;
				if (pA === -1) pA = 999;
				if (pB === -1) pB = 999;
				return pA - pB;
			});

			// Round-robin spread across days, targeting 1 class per day, then 2, up to maxClassesPerSubjectPerDay
			for (let targetPerDay = 1; targetPerDay <= maxClassesPerSubjectPerDay && needed > 0; targetPerDay++) {
				for (const pass of passes) {
					for (let d = 0; d < daysPerWeek && needed > 0; d++) {

						let subjectCountToday = 0;
						for (let p = 0; p < totalPeriods; p++) {
							if (classroomSchedule[d][p]?.subjectId === currentSubj.subjectId) {
								subjectCountToday++;
							}
						}

						if (subjectCountToday >= targetPerDay) {
							continue;
						}

						for (let p = pass.start; p < pass.end && needed > 0; p++) {
							if (subjectCountToday >= targetPerDay) {
								break;
							}

							if (!classroomSchedule[d][p]) {
								const chosenTeacher = capableTeachers.find(t => {
									if (p >= classesPerDay && !t.canTeachAfternoon) {
										return false;
									}
									if (teacherSchedule[t.id][d][p]) {
										return false;
									}
									return true;
								});

								if (chosenTeacher) {
									classroomSchedule[d][p] = { subjectId: currentSubj.subjectId, teacherId: chosenTeacher.id };
									teacherSchedule[chosenTeacher.id][d][p] = true;
									needed--;
									subjectCountToday++;
								}
							}
						}
					}
				}
			}

			if (needed > 0) {
				missingClasses.push({ subjectId: currentSubj.subjectId, count: needed });
			}
		}
		timetable.push({ classroomId: c.id, shift: c.shift || 'Manhã', schedule: classroomSchedule, missingClasses });
	}

	return timetable;
}
