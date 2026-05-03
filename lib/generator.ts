import {
	Classroom,
	ClassroomSubject,
	MissingClass,
	Teacher,
	TimetableClassroomResult,
	TimetableSlot,
	TimetableState,
} from "./types";
import { normalizeSettings } from "./settingsLimits";

/*
	Referências usadas para a abordagem: OR-Tools Scheduling e CP-SAT employee scheduling.
	Heuristica de montagem da grade:
	1. A grade vazia e a agenda global dos professores sao criadas antes de qualquer alocacao.
	2. Cada par turma-materia vira uma tarefa, ordenada das mais dificeis para as mais faceis
	   (menos professores possiveis, menos slots viaveis e maior carga semanal).
	3. Para cada tarefa, o algoritmo escolhe um unico professor e tenta alocar todas as aulas
	   dessa materia nessa turma com ele. Isso garante que uma turma nao tenha dois professores
	   diferentes para a mesma materia.
	4. Cada alocacao respeita conflitos de professor, indisponibilidade, turno, limite diario da
	   materia e maxWeeklyClasses como restricao hard.
	5. Quando nao ha slot livre direto, o reparo local tenta mover uma aula ja marcada da mesma
	   turma para outro horario valido, liberando o slot para a aula mais restrita.
	6. Somente as aulas que nao couberem apos a tentativa direta e o reparo local entram em
	   missingClasses.
*/

type PeriodWindow = {
	start: number;
	end: number;
};

type ClassroomRuntime = {
	classroom: Classroom;
	result: TimetableClassroomResult;
	periodOrder: number[];
	totalPeriods: number;
};

type GeneratorContext = {
	classesPerDay: number;
	daysPerWeek: number;
	maxClassesPerSubjectPerDay: number;
	teacherLoads: Record<string, number>;
	teacherSchedule: Record<string, boolean[][]>;
	teachersById: Map<string, Teacher>;
	runtimes: Map<string, ClassroomRuntime>;
};

type CourseTask = {
	classroom: Classroom;
	subject: ClassroomSubject;
	capableTeachers: Teacher[];
	availableSlotCount: number;
};

type PlacementResult = {
	placed: number;
	cost: number;
};

type SlotCandidate = {
	day: number;
	period: number;
	cost: number;
};

type RepairCandidate = SlotCandidate & {
	moveToDay: number;
	moveToPeriod: number;
	occupiedSlot: TimetableSlot;
};

export function generateTimetable(state: TimetableState) {
	const { classrooms, teachers } = state;
	const settings = normalizeSettings(state.settings);
	const { daysPerWeek, classesPerDay, maxClassesPerSubjectPerDay } = settings;
	const context = createContext(
		classrooms,
		teachers,
		classesPerDay,
		daysPerWeek,
		maxClassesPerSubjectPerDay,
		settings.integralShiftPriority || "Manhã",
	);
	const tasks = createCourseTasks(context, classrooms, teachers);

	for (const task of tasks) {
		const runtime = context.runtimes.get(task.classroom.id);

		if (!runtime || task.capableTeachers.length === 0) {
			addMissingClass(context, task.classroom.id, task.subject.subjectId, task.subject.weeklyClasses);
			continue;
		}

		const chosenTeacher = chooseTeacherForTask(context, task);

		if (!chosenTeacher) {
			addMissingClass(context, task.classroom.id, task.subject.subjectId, task.subject.weeklyClasses);
			continue;
		}

		const placement = placeCourseLessons(context, runtime, task.subject, chosenTeacher);
		const missingCount = task.subject.weeklyClasses - placement.placed;

		if (missingCount > 0) {
			addMissingClass(context, task.classroom.id, task.subject.subjectId, missingCount);
		}
	}

	return classrooms.map((classroom) => context.runtimes.get(classroom.id)!.result);
}

function createContext(
	classrooms: Classroom[],
	teachers: Teacher[],
	classesPerDay: number,
	daysPerWeek: number,
	maxClassesPerSubjectPerDay: number,
	integralShiftPriority: "Manhã" | "Tarde",
): GeneratorContext {
	const context: GeneratorContext = {
		classesPerDay,
		daysPerWeek,
		maxClassesPerSubjectPerDay,
		teacherLoads: {},
		teacherSchedule: {},
		teachersById: new Map(teachers.map((teacher) => [teacher.id, teacher])),
		runtimes: new Map(),
	};

	for (const teacher of teachers) {
		context.teacherLoads[teacher.id] = 0;
		context.teacherSchedule[teacher.id] = Array.from({ length: daysPerWeek }, () =>
			Array.from({ length: classesPerDay * 2 }, () => false),
		);

		for (const constraint of teacher.unavailableConstraints || []) {
			const dayIndex = getConstraintDayIndex(constraint.dayOfWeek, daysPerWeek);

			if (dayIndex === null) {
				continue;
			}

			for (const period of constraint.periods) {
				if (period >= 0 && period < classesPerDay * 2) {
					context.teacherSchedule[teacher.id][dayIndex][period] = true;
				}
			}
		}
	}

	for (const classroom of classrooms) {
		const { periodOrder, totalPeriods } = getClassroomPeriods(classroom, classesPerDay, integralShiftPriority);
		const schedule = Array.from({ length: daysPerWeek }, () =>
			Array.from({ length: totalPeriods }, (): TimetableSlot | null => null),
		);

		context.runtimes.set(classroom.id, {
			classroom,
			periodOrder,
			totalPeriods,
			result: {
				classroomId: classroom.id,
				shift: classroom.shift || "Manhã",
				schedule,
				missingClasses: [],
			},
		});
	}

	return context;
}

function getConstraintDayIndex(dayOfWeek: number, daysPerWeek: number) {
	if (dayOfWeek >= 1 && dayOfWeek <= daysPerWeek) {
		return dayOfWeek - 1;
	}

	if (dayOfWeek >= 0 && dayOfWeek < daysPerWeek) {
		return dayOfWeek;
	}

	return null;
}

function getClassroomPeriods(classroom: Classroom, classesPerDay: number, integralShiftPriority: "Manhã" | "Tarde") {
	const morning: PeriodWindow = { start: 0, end: classesPerDay };
	const afternoon: PeriodWindow = { start: classesPerDay, end: classesPerDay * 2 };

	if (classroom.shift === "Tarde") {
		return {
			totalPeriods: classesPerDay * 2,
			periodOrder: expandWindows([afternoon]),
		};
	}

	if (classroom.shift === "Integral") {
		const windows = integralShiftPriority === "Tarde" ? [afternoon, morning] : [morning, afternoon];
		return {
			totalPeriods: classesPerDay * 2,
			periodOrder: expandWindows(windows),
		};
	}

	return {
		totalPeriods: classesPerDay,
		periodOrder: expandWindows([morning]),
	};
}

function expandWindows(windows: PeriodWindow[]) {
	return windows.flatMap((window) => {
		const periods: number[] = [];

		for (let period = window.start; period < window.end; period++) {
			periods.push(period);
		}

		return periods;
	});
}

function createCourseTasks(context: GeneratorContext, classrooms: Classroom[], teachers: Teacher[]) {
	const tasks: CourseTask[] = [];

	for (const classroom of classrooms) {
		const runtime = context.runtimes.get(classroom.id);

		if (!runtime) {
			continue;
		}

		for (const subject of classroom.subjects) {
			const capableTeachers = teachers.filter((teacher) => teacher.allowedSubjectIds.includes(subject.subjectId));
			const availableSlotCount = capableTeachers.reduce((total, teacher) => {
				return total + countTeacherViableSlots(context, runtime, teacher);
			}, 0);

			tasks.push({ classroom, subject, capableTeachers, availableSlotCount });
		}
	}

	return tasks.sort((a, b) => {
		const teacherDiff = a.capableTeachers.length - b.capableTeachers.length;

		if (teacherDiff !== 0) {
			return teacherDiff;
		}

		const slotDiff = a.availableSlotCount - b.availableSlotCount;

		if (slotDiff !== 0) {
			return slotDiff;
		}

		return b.subject.weeklyClasses - a.subject.weeklyClasses;
	});
}

function countTeacherViableSlots(context: GeneratorContext, runtime: ClassroomRuntime, teacher: Teacher) {
	let count = 0;

	for (let day = 0; day < context.daysPerWeek; day++) {
		for (const period of runtime.periodOrder) {
			if (canTeacherTeachAt(context, teacher, day, period)) {
				count++;
			}
		}
	}

	return Math.min(count, Math.max(0, teacher.maxWeeklyClasses - context.teacherLoads[teacher.id]));
}

function chooseTeacherForTask(context: GeneratorContext, task: CourseTask) {
	let bestTeacher: Teacher | null = null;
	let bestPlacement: PlacementResult | null = null;

	for (const teacher of sortTeachersForSubject(context, task.capableTeachers, task.subject.subjectId)) {
		const remainingLoad = teacher.maxWeeklyClasses - context.teacherLoads[teacher.id];

		if (remainingLoad <= 0) {
			continue;
		}

		const simulatedContext = cloneContext(context);
		const runtime = simulatedContext.runtimes.get(task.classroom.id);

		if (!runtime) {
			continue;
		}

		const placement = placeCourseLessons(simulatedContext, runtime, task.subject, teacher);

		if (!bestPlacement || isBetterPlacement(placement, bestPlacement, task.subject.weeklyClasses)) {
			bestTeacher = teacher;
			bestPlacement = placement;
		}
	}

	return bestTeacher;
}

function sortTeachersForSubject(context: GeneratorContext, teachers: Teacher[], subjectId: string) {
	return [...teachers].sort((a, b) => {
		const priorityA = getSubjectPriority(a, subjectId);
		const priorityB = getSubjectPriority(b, subjectId);

		if (priorityA !== priorityB) {
			return priorityA - priorityB;
		}

		return context.teacherLoads[a.id] - context.teacherLoads[b.id];
	});
}

function getSubjectPriority(teacher: Teacher, subjectId: string) {
	const priority = teacher.subjectPriorityIds?.indexOf(subjectId) ?? -1;
	return priority === -1 ? 999 : priority;
}

function isBetterPlacement(candidate: PlacementResult, current: PlacementResult, needed: number) {
	const candidateComplete = candidate.placed === needed;
	const currentComplete = current.placed === needed;

	if (candidateComplete !== currentComplete) {
		return candidateComplete;
	}

	if (candidate.placed !== current.placed) {
		return candidate.placed > current.placed;
	}

	return candidate.cost < current.cost;
}

function placeCourseLessons(
	context: GeneratorContext,
	runtime: ClassroomRuntime,
	subject: ClassroomSubject,
	teacher: Teacher,
): PlacementResult {
	let placed = 0;
	let cost = 0;

	while (placed < subject.weeklyClasses) {
		const directSlot = findBestDirectSlot(context, runtime, subject.subjectId, teacher);

		if (directSlot) {
			placeSlot(context, runtime, subject.subjectId, teacher.id, directSlot.day, directSlot.period);
			placed++;
			cost += directSlot.cost;
			continue;
		}

		const repairSlot = findBestRepairSlot(context, runtime, subject.subjectId, teacher);

		if (repairSlot) {
			applyRepair(context, runtime, subject.subjectId, teacher.id, repairSlot);
			placed++;
			cost += repairSlot.cost;
			continue;
		}

		break;
	}

	return { placed, cost };
}

function findBestDirectSlot(
	context: GeneratorContext,
	runtime: ClassroomRuntime,
	subjectId: string,
	teacher: Teacher,
) {
	let bestSlot: SlotCandidate | null = null;

	for (let day = 0; day < context.daysPerWeek; day++) {
		if (countSubjectOnDay(runtime, day, subjectId) >= context.maxClassesPerSubjectPerDay) {
			continue;
		}

		for (const period of runtime.periodOrder) {
			if (runtime.result.schedule[day][period] || !canPlaceTeacher(context, teacher, day, period)) {
				continue;
			}

			const candidate = {
				day,
				period,
				cost: scoreSlot(context, runtime, day, period, subjectId, teacher.id),
			};

			if (!bestSlot || candidate.cost < bestSlot.cost) {
				bestSlot = candidate;
			}
		}
	}

	return bestSlot;
}

function findBestRepairSlot(
	context: GeneratorContext,
	runtime: ClassroomRuntime,
	subjectId: string,
	teacher: Teacher,
) {
	let bestRepair: RepairCandidate | null = null;

	if (!teacherHasRemainingLoad(context, teacher)) {
		return null;
	}

	for (let day = 0; day < context.daysPerWeek; day++) {
		if (countSubjectOnDay(runtime, day, subjectId) >= context.maxClassesPerSubjectPerDay) {
			continue;
		}

		for (const period of runtime.periodOrder) {
			const occupiedSlot = runtime.result.schedule[day][period];

			if (!occupiedSlot || occupiedSlot.subjectId === subjectId || !canTeacherUseFreedSlot(context, teacher, occupiedSlot, day, period)) {
				continue;
			}

			const moveDestination = findMoveDestination(context, runtime, occupiedSlot, day, period);

			if (!moveDestination) {
				continue;
			}

			const candidate = {
				day,
				period,
				moveToDay: moveDestination.day,
				moveToPeriod: moveDestination.period,
				occupiedSlot,
				cost: scoreSlot(context, runtime, day, period, subjectId, teacher.id) + moveDestination.cost + 50,
			};

			if (!bestRepair || candidate.cost < bestRepair.cost) {
				bestRepair = candidate;
			}
		}
	}

	return bestRepair;
}

function findMoveDestination(
	context: GeneratorContext,
	runtime: ClassroomRuntime,
	occupiedSlot: TimetableSlot,
	fromDay: number,
	fromPeriod: number,
) {
	let bestDestination: SlotCandidate | null = null;
	const occupyingTeacher = getTeacherById(context, occupiedSlot.teacherId);

	if (!occupyingTeacher) {
		return null;
	}

	for (let day = 0; day < context.daysPerWeek; day++) {
		if (day !== fromDay && countSubjectOnDay(runtime, day, occupiedSlot.subjectId) >= context.maxClassesPerSubjectPerDay) {
			continue;
		}

		for (const period of runtime.periodOrder) {
			if (day === fromDay && period === fromPeriod) {
				continue;
			}

			if (runtime.result.schedule[day][period] || !canTeacherTeachAt(context, occupyingTeacher, day, period)) {
				continue;
			}

			const candidate = {
				day,
				period,
				cost: scoreSlot(context, runtime, day, period, occupiedSlot.subjectId, occupiedSlot.teacherId),
			};

			if (!bestDestination || candidate.cost < bestDestination.cost) {
				bestDestination = candidate;
			}
		}
	}

	return bestDestination;
}

function canPlaceTeacher(context: GeneratorContext, teacher: Teacher, day: number, period: number) {
	return teacherHasRemainingLoad(context, teacher) && canTeacherTeachAt(context, teacher, day, period);
}

function canTeacherTeachAt(context: GeneratorContext, teacher: Teacher, day: number, period: number) {
	if (period >= context.classesPerDay && !teacher.canTeachAfternoon) {
		return false;
	}

	return !context.teacherSchedule[teacher.id][day][period];
}

function canTeacherUseFreedSlot(
	context: GeneratorContext,
	teacher: Teacher,
	occupiedSlot: TimetableSlot,
	day: number,
	period: number,
) {
	if (period >= context.classesPerDay && !teacher.canTeachAfternoon) {
		return false;
	}

	return occupiedSlot.teacherId === teacher.id || !context.teacherSchedule[teacher.id][day][period];
}

function teacherHasRemainingLoad(context: GeneratorContext, teacher: Teacher) {
	return context.teacherLoads[teacher.id] < teacher.maxWeeklyClasses;
}

function placeSlot(
	context: GeneratorContext,
	runtime: ClassroomRuntime,
	subjectId: string,
	teacherId: string,
	day: number,
	period: number,
) {
	runtime.result.schedule[day][period] = { subjectId, teacherId };
	context.teacherSchedule[teacherId][day][period] = true;
	context.teacherLoads[teacherId]++;
}

function applyRepair(
	context: GeneratorContext,
	runtime: ClassroomRuntime,
	subjectId: string,
	teacherId: string,
	repair: RepairCandidate,
) {
	runtime.result.schedule[repair.day][repair.period] = null;
	context.teacherSchedule[repair.occupiedSlot.teacherId][repair.day][repair.period] = false;

	runtime.result.schedule[repair.moveToDay][repair.moveToPeriod] = repair.occupiedSlot;
	context.teacherSchedule[repair.occupiedSlot.teacherId][repair.moveToDay][repair.moveToPeriod] = true;

	placeSlot(context, runtime, subjectId, teacherId, repair.day, repair.period);
}

function scoreSlot(
	context: GeneratorContext,
	runtime: ClassroomRuntime,
	day: number,
	period: number,
	subjectId: string,
	teacherId: string,
) {
	const subjectCount = countSubjectOnDay(runtime, day, subjectId);
	const dayLoad = runtime.result.schedule[day].filter(Boolean).length;
	const periodRank = runtime.periodOrder.indexOf(period);

	return subjectCount * 1000 + dayLoad * 20 + context.teacherLoads[teacherId] * 5 + periodRank;
}

function countSubjectOnDay(runtime: ClassroomRuntime, day: number, subjectId: string) {
	return runtime.result.schedule[day].filter((slot) => slot?.subjectId === subjectId).length;
}

function addMissingClass(context: GeneratorContext, classroomId: string, subjectId: string, count: number) {
	const runtime = context.runtimes.get(classroomId);

	if (!runtime || count <= 0) {
		return;
	}

	const existing = runtime.result.missingClasses.find((missingClass) => missingClass.subjectId === subjectId);

	if (existing) {
		existing.count += count;
		return;
	}

	const missingClass: MissingClass = { subjectId, count };
	runtime.result.missingClasses.push(missingClass);
}

function cloneContext(context: GeneratorContext): GeneratorContext {
	return {
		classesPerDay: context.classesPerDay,
		daysPerWeek: context.daysPerWeek,
		maxClassesPerSubjectPerDay: context.maxClassesPerSubjectPerDay,
		teacherLoads: { ...context.teacherLoads },
		teachersById: context.teachersById,
		teacherSchedule: Object.fromEntries(
			Object.entries(context.teacherSchedule).map(([teacherId, days]) => [
				teacherId,
				days.map((periods) => [...periods]),
			]),
		),
		runtimes: new Map(
			[...context.runtimes.entries()].map(([classroomId, runtime]) => [
				classroomId,
				{
					...runtime,
					result: {
						...runtime.result,
						schedule: runtime.result.schedule.map((day) =>
							day.map((slot) => (slot ? { ...slot } : null)),
						),
						missingClasses: runtime.result.missingClasses.map((missingClass) => ({ ...missingClass })),
					},
				},
			]),
		),
	};
}

function getTeacherById(context: GeneratorContext, teacherId: string) {
	return context.teachersById.get(teacherId) || null;
}
