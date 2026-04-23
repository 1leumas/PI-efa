export interface Settings {
    classesPerDay: number;
    daysPerWeek: number; // e.g., 5 for Mon-Fri
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

export interface Classroom {
    id: string;
    name: string;
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
    unavailableConstraints: TeacherTimeConstraint[]; // when they cannot teach
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

    importData: (data: Omit<TimetableState, 'updateSettings' | 'addSubject' | 'updateSubject' | 'deleteSubject' | 'addClassroom' | 'updateClassroom' | 'deleteClassroom' | 'addTeacher' | 'updateTeacher' | 'deleteTeacher' | 'importData' | 'resetData'>, mode: 'replace' | 'merge') => void;
    resetData: () => void;
}
