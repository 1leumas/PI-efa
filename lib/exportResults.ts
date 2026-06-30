import type { Classroom, Settings, ShiftType, Subject, Teacher, TimetableClassroomResult, TimetableSlot } from "./types";

interface ResultsExcelData {
	timetableResult: TimetableClassroomResult[];
	classrooms: Classroom[];
	subjects: Subject[];
	teachers: Teacher[];
	settings: Settings;
}

export function getPeriodsToRender(shift: ShiftType, classesPerDay: number) {
	const start = shift === "Tarde" ? classesPerDay : 0;
	const end = shift === "Integral" || shift === "Tarde" ? classesPerDay * 2 : classesPerDay;
	return Array.from({ length: end - start }, (_, index) => start + index);
}

function escapeHtml(value: string | number) {
	return String(value).replace(/[&<>"']/g, (char) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	}[char]!));
}

const dayName = (dayIndex: number) => {
	const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
	return days[dayIndex] || `Dia ${dayIndex}`;
};

export function buildResultsExcelHtml({ timetableResult, classrooms, subjects, teachers, settings }: ResultsExcelData) {
	const subjectName = (id: string) => subjects.find((subject) => subject.id === id)?.name || "-";
	const teacherName = (id: string) => teachers.find((teacher) => teacher.id === id)?.name || "Sem prof.";
	const classroom = (id: string) => classrooms.find((item) => item.id === id);
	const slotText = (slot: TimetableSlot | null) => slot
		? `${escapeHtml(subjectName(slot.subjectId))}<br>${escapeHtml(teacherName(slot.teacherId))}`
		: "";

	const rows = timetableResult.map((result) => {
		const currentClassroom = classroom(result.classroomId);
		const shift = result.shift || currentClassroom?.shift || "Manhã";
		const colspan = result.schedule.length + 1;
		const scheduleRows = getPeriodsToRender(shift, settings.classesPerDay).map((period, periodIndex) => (
			`<tr><td>Aula ${periodIndex + 1}</td>${result.schedule.map((day) => `<td>${slotText(day[period])}</td>`).join("")}</tr>`
		));
		const missingRows = result.missingClasses.length
			? [
				`<tr><th colspan="${colspan}">Aulas pendentes</th></tr>`,
				...result.missingClasses.map((missingClass) => (
					`<tr><td>${escapeHtml(subjectName(missingClass.subjectId))}</td><td colspan="${result.schedule.length}">Faltam ${missingClass.count} aula(s)</td></tr>`
				)),
			]
			: [];

		return [
			`<tr><th colspan="${colspan}">${escapeHtml(currentClassroom?.name || "Desconhecida")}</th></tr>`,
			`<tr><td>Turno</td><td colspan="${result.schedule.length}">${escapeHtml(shift)}</td></tr>`,
			`<tr><th>Período</th>${result.schedule.map((_day, index) => `<th>${escapeHtml(dayName(index + 1))}</th>`).join("")}</tr>`,
			...scheduleRows,
			...missingRows,
			`<tr><td colspan="${colspan}">&nbsp;</td></tr>`,
		].join("");
	}).join("");

	return `<!doctype html><html><head><meta charset="utf-8" /></head><body><table border="1">${rows}</table></body></html>`;
}

export function downloadResultsExcel(data: ResultsExcelData) {
	const blob = new Blob(["\ufeff", buildResultsExcelHtml(data)], { type: "application/vnd.ms-excel;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `tabela_horarios_${new Date().toISOString().slice(0, 10)}.xls`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
