export interface Settings {
	classesPerDay: number;
	daysPerWeek: number; // e.g., 5 for Mon-Fri
	maxClassesPerSubjectPerDay: number;
	integralShiftPriority?: 'Manhã' | 'Tarde';
}

export interface Subject {
	id: string;
	name: string;
	color?: string; // Hex color for ui
}

export interface ClassroomSubject {
	subjectId: string;
	weeklyClasses: number;
}

export type ShiftType = 'Manhã' | 'Tarde' | 'Integral';

export interface Classroom {
	id: string;
	name: string;
	shift: ShiftType;
	subjects: ClassroomSubject[];
}

export interface TeacherTimeConstraint {
	dayOfWeek: number; // 0-6 (0=Sun, 1=Mon, etc.)
	periods: number[]; // Array of period indices (e.g. [0, 1] means 1st and 2nd period unavailable)
}

export interface Teacher {
	id: string;
	name: string;
	allowedSubjectIds: string[]; // which subjects they can teach
	subjectPriorityIds: string[]; // subjects they prefer to teach (ordered)
	maxWeeklyClasses: number;
	canTeachAfternoon?: boolean; // simple flag for afternoon availability
	unavailableConstraints: TeacherTimeConstraint[]; // when they cannot teach
}

export interface TimetableSlot {
	subjectId: string;
	teacherId: string;
}

export interface MissingClass {
	subjectId: string;
	count: number;
}

export interface TimetableClassroomResult {
	classroomId: string;
	shift: ShiftType;
	schedule: (TimetableSlot | null)[][];
	missingClasses: MissingClass[];
}

export interface TimetableState {
	settings: Settings;
	subjects: Subject[];
	classrooms: Classroom[];
	teachers: Teacher[];

	// Actions
	updateSettings: (settings: Partial<Settings>) => void;

	addSubject: (subject: Subject) => void;
	updateSubject: (id: string, subject: Partial<Subject>) => void;
	deleteSubject: (id: string) => void;

	addClassroom: (classroom: Classroom) => void;
	updateClassroom: (id: string, classroom: Partial<Classroom>) => void;
	deleteClassroom: (id: string) => void;

	addTeacher: (teacher: Teacher) => void;
	updateTeacher: (id: string, teacher: Partial<Teacher>) => void;
	deleteTeacher: (id: string) => void;

	timetableResult: TimetableClassroomResult[] | null;
	setTimetableResult: (result: TimetableClassroomResult[] | null) => void;

	importData: (data: Omit<TimetableState, 'updateSettings' | 'addSubject' | 'updateSubject' | 'deleteSubject' | 'addClassroom' | 'updateClassroom' | 'deleteClassroom' | 'addTeacher' | 'updateTeacher' | 'deleteTeacher' | 'importData' | 'resetData' | 'timetableResult' | 'setTimetableResult'>, mode: 'replace' | 'merge') => void;
	resetData: () => void;
}
