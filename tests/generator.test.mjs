import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { Script } from "node:vm";
import ts from "typescript";

async function loadTsModule(path) {
	const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
	const { outputText } = ts.transpileModule(source, {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2020,
		},
	});

	const cjsModule = { exports: {} };
	const script = new Script(outputText);
	const require = (modulePath) => {
		if (modulePath === "./settingsLimits") {
			return loadTsModule.syncSettingsLimits;
		}
		if (modulePath === "./types") {
			return {};
		}
		throw new Error(`Unexpected import: ${modulePath}`);
	};
	script.runInNewContext({ exports: cjsModule.exports, module: cjsModule, require });
	return cjsModule.exports;
}

async function loadGenerator() {
	loadTsModule.syncSettingsLimits = await loadTsModule("lib/settingsLimits.ts");
	return loadTsModule("lib/generator.ts");
}

function baseState(overrides) {
	return {
		settings: {
			classesPerDay: 2,
			daysPerWeek: 2,
			maxClassesPerSubjectPerDay: 2,
			integralShiftPriority: "Manhã",
		},
		subjects: [{ id: "math", name: "Matemática" }],
		classrooms: [],
		teachers: [],
		timetableResult: null,
		...overrides,
	};
}

function assignedSlots(result) {
	return result.flatMap((classroom) => classroom.schedule.flat().filter(Boolean));
}

test("generateTimetable treats teacher maxWeeklyClasses as a hard constraint", async () => {
	const { generateTimetable } = await loadGenerator();
	const state = baseState({
		classrooms: [{
			id: "class-a",
			name: "Turma A",
			shift: "Manhã",
			subjects: [{ subjectId: "math", weeklyClasses: 4 }],
		}],
		teachers: [{
			id: "teacher-a",
			name: "Prof A",
			allowedSubjectIds: ["math"],
			subjectPriorityIds: ["math"],
			maxWeeklyClasses: 2,
			canTeachAfternoon: false,
			unavailableConstraints: [],
		}],
	});

	const [classResult] = generateTimetable(state);

	assert.equal(assignedSlots([classResult]).length, 2);
	assert.equal(JSON.stringify(classResult.missingClasses), JSON.stringify([{ subjectId: "math", count: 2 }]));
});

test("generateTimetable uses one teacher for the same subject in the same classroom", async () => {
	const { generateTimetable } = await loadGenerator();
	const state = baseState({
		classrooms: [{
			id: "class-a",
			name: "Turma A",
			shift: "Manhã",
			subjects: [{ subjectId: "math", weeklyClasses: 4 }],
		}],
		teachers: [
			{
				id: "teacher-a",
				name: "Prof A",
				allowedSubjectIds: ["math"],
				subjectPriorityIds: ["math"],
				maxWeeklyClasses: 4,
				canTeachAfternoon: false,
				unavailableConstraints: [{ dayOfWeek: 1, periods: [0] }],
			},
			{
				id: "teacher-b",
				name: "Prof B",
				allowedSubjectIds: ["math"],
				subjectPriorityIds: ["math"],
				maxWeeklyClasses: 4,
				canTeachAfternoon: false,
				unavailableConstraints: [],
			},
		],
	});

	const [classResult] = generateTimetable(state);
	const teacherIds = new Set(assignedSlots([classResult]).map((slot) => slot.teacherId));

	assert.deepEqual([...teacherIds], ["teacher-b"]);
	assert.equal(classResult.missingClasses.length, 0);
});

test("generateTimetable fills the bundled sample data without violating teacher load caps", async () => {
	const { generateTimetable } = await loadGenerator();
	const sample = JSON.parse(await readFile(new URL("../dummy_data.json", import.meta.url), "utf8"));

	const result = generateTimetable({ ...sample, timetableResult: null });
	const totalMissing = result.reduce(
		(total, classroom) => total + classroom.missingClasses.reduce((sum, item) => sum + item.count, 0),
		0,
	);
	const teacherLoads = Object.fromEntries(sample.teachers.map((teacher) => [teacher.id, 0]));

	for (const slot of assignedSlots(result)) {
		teacherLoads[slot.teacherId] += 1;
	}

	assert.equal(totalMissing, 0);
	for (const teacher of sample.teachers) {
		assert.ok(
			teacherLoads[teacher.id] <= teacher.maxWeeklyClasses,
			`${teacher.name} exceeded maxWeeklyClasses`,
		);
	}
});
