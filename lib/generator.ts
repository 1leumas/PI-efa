import { TimetableState } from "./types";

export function generateTimetable(state: TimetableState) {
    const { settings, classrooms, subjects, teachers } = state;
    const { daysPerWeek, classesPerDay } = settings;

    const timetable = []; // the resulting 3D grid
    // Quick greedy implementation: iterate classes -> subjects -> slots

    for (const c of classrooms) {
        const classroomSchedule: any[] = [];
        for (let d = 0; d < daysPerWeek; d++) {
            classroomSchedule[d] = [];
            for (let period = 0; period < classesPerDay; period++) {
                classroomSchedule[d][period] = null;
            }
        }

        for (const currentSubj of c.subjects) {
            let needed = currentSubj.weeklyClasses;

            const capableTeachers = teachers.filter(t => t.allowedSubjectIds.includes(currentSubj.subjectId));
            capableTeachers.sort((a, b) => {
                let pA = a.subjectPriorityIds.indexOf(currentSubj.subjectId);
                let pB = b.subjectPriorityIds.indexOf(currentSubj.subjectId);
                if (pA === -1) pA = 999;
                if (pB === -1) pB = 999;
                return pA - pB;
            });

            const assignedTeacher = capableTeachers[0];

            for (let d = 0; d < daysPerWeek && needed > 0; d++) {
                for (let p = 0; p < classesPerDay && needed > 0; p++) {
                    if (!classroomSchedule[d][p]) {
                        classroomSchedule[d][p] = { subjectId: currentSubj.subjectId, teacherId: assignedTeacher?.id };
                        needed--;
                    }
                }
            }
        }
        timetable.push({ classroomId: c.id, schedule: classroomSchedule });
    }

    return timetable;
}
