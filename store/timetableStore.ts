import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TimetableState, Settings } from '@/lib/types';
import { normalizeSettings } from '@/lib/settingsLimits';

const defaultSettings: Settings = {
	classesPerDay: 5,
	daysPerWeek: 5,
	maxClassesPerSubjectPerDay: 2,
	integralShiftPriority: 'Manhã',
};

export const useTimetableStore = create<TimetableState>()(
	persist(
		(set) => ({
			settings: defaultSettings,
			subjects: [],
			classrooms: [],
			teachers: [],

			updateSettings: (newSettings) => set((state) => ({
				settings: normalizeSettings({ ...state.settings, ...newSettings }, state.settings)
			})),

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

			timetableResult: null,
			setTimetableResult: (result) => set({ timetableResult: result }),

			importData: (data, mode) => {
				if (mode === 'replace') {
					set({
						settings: normalizeSettings(data.settings || defaultSettings, defaultSettings),
						subjects: data.subjects || [],
						classrooms: data.classrooms || [],
						teachers: data.teachers || [],
					});
				} else if (mode === 'merge') {
					set((state) => ({
						settings: normalizeSettings({ ...state.settings, ...(data.settings || {}) }, state.settings),
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
