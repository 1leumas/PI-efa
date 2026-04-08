import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TimetableState, Settings, Subject, Classroom, Teacher } from '@/lib/types';

const defaultSettings: Settings = {
    classDurationMinutes: 50,
    classesPerDay: 5,
    daysPerWeek: 5,
};

export const useTimetableStore = create<TimetableState>()(
    persist(
        (set, get) => ({
            settings: defaultSettings,
            subjects: [],
            classrooms: [],
            teachers: [],

            updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),

            addSubject: (subject) => set((state) => ({ subjects: [...state.subjects, subject] })),
            updateSubject: (id, subject) => set((state) => ({ subjects: state.subjects.map((s) => s.id === id ? { ...s, ...subject } : s) })),
            deleteSubject: (id) => set((state) => ({
                subjects: state.subjects.filter((s) => s.id !== id),
                classrooms: state.classrooms.map((c) => ({
                    ...c,
                    subjects: c.subjects.filter((cs) => cs.subjectId !== id)
                })),
                teachers: state.teachers.map((t) => ({
                    ...t,
                    allowedSubjectIds: (t.allowedSubjectIds || []).filter((subId) => subId !== id),
                    subjectPriorityIds: (t.subjectPriorityIds || []).filter((subId) => subId !== id)
                }))
            })),

            addClassroom: (classroom) => set((state) => ({ classrooms: [...state.classrooms, classroom] })),
            updateClassroom: (id, classroom) => set((state) => ({ classrooms: state.classrooms.map((c) => c.id === id ? { ...c, ...classroom } : c) })),
            deleteClassroom: (id) => set((state) => ({ classrooms: state.classrooms.filter((c) => c.id !== id) })),

            addTeacher: (teacher) => set((state) => ({ teachers: [...state.teachers, teacher] })),
            updateTeacher: (id, teacher) => set((state) => ({ teachers: state.teachers.map((t) => t.id === id ? { ...t, ...teacher } : t) })),
            deleteTeacher: (id) => set((state) => ({ teachers: state.teachers.filter((t) => t.id !== id) })),

            importData: (data, mode) => {
                if (mode === 'replace') {
                    set({
                        settings: data.settings || defaultSettings,
                        subjects: data.subjects || [],
                        classrooms: data.classrooms || [],
                        teachers: data.teachers || [],
                    });
                } else if (mode === 'merge') {
                    set((state) => ({
                        settings: { ...state.settings, ...(data.settings || {}) },
                        subjects: [...state.subjects, ...(data.subjects || []).filter(newSub => !state.subjects.some(s => s.id === newSub.id))],
                        classrooms: [...state.classrooms, ...(data.classrooms || []).filter(newClass => !state.classrooms.some(c => c.id === newClass.id))],
                        teachers: [...state.teachers, ...(data.teachers || []).filter(newTeach => !state.teachers.some(t => t.id === newTeach.id))],
                    }));
                }
            },

            resetData: () => set({ settings: defaultSettings, subjects: [], classrooms: [], teachers: [] }),
        }),
        {
            name: 'timetable-storage',
        }
    )
);
