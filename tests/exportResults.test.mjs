import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { Script } from "node:vm";
import ts from "typescript";

async function loadExportResults() {
	const source = await readFile(new URL("../lib/exportResults.ts", import.meta.url), "utf8");
	const { outputText } = ts.transpileModule(source, {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2020,
		},
	});

	const cjsModule = { exports: {} };
	const script = new Script(outputText);
	script.runInNewContext({ exports: cjsModule.exports, module: cjsModule, Blob, URL, document: {} });
	return cjsModule.exports;
}

test("getPeriodsToRender picks the visible shift window", async () => {
	const { getPeriodsToRender } = await loadExportResults();

	assert.equal(JSON.stringify(getPeriodsToRender("Manhã", 2)), JSON.stringify([0, 1]));
	assert.equal(JSON.stringify(getPeriodsToRender("Tarde", 2)), JSON.stringify([2, 3]));
	assert.equal(JSON.stringify(getPeriodsToRender("Integral", 2)), JSON.stringify([0, 1, 2, 3]));
});

test("buildResultsExcelHtml exports escaped timetable data", async () => {
	const { buildResultsExcelHtml } = await loadExportResults();
	const html = buildResultsExcelHtml({
		settings: { classesPerDay: 1, daysPerWeek: 1, maxClassesPerSubjectPerDay: 1 },
		subjects: [{ id: "math", name: "Matemática & Lógica" }],
		teachers: [{ id: "ana", name: "Ana <Prof>", allowedSubjectIds: [], subjectPriorityIds: [], maxWeeklyClasses: 1, unavailableConstraints: [] }],
		classrooms: [{ id: "class-a", name: "Turma A", shift: "Manhã", subjects: [] }],
		timetableResult: [{
			classroomId: "class-a",
			shift: "Manhã",
			schedule: [[{ subjectId: "math", teacherId: "ana" }]],
			missingClasses: [{ subjectId: "math", count: 1 }],
		}],
	});

	assert.match(html, /Matemática &amp; Lógica/);
	assert.match(html, /Ana &lt;Prof&gt;/);
	assert.match(html, /Aulas pendentes/);
	assert.match(html, /Faltam 1 aula\(s\)/);
});
