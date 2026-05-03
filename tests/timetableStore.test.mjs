import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { Script } from "node:vm";
import ts from "typescript";
import { create } from "zustand";

const persist = (initializer) => initializer;

async function loadTsModule(path, overrides = {}) {
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
		if (modulePath in overrides) {
			return overrides[modulePath];
		}
		if (modulePath === "@/lib/types") {
			return {};
		}
		throw new Error(`Unexpected import: ${modulePath}`);
	};

	script.runInNewContext({
		exports: cjsModule.exports,
		module: cjsModule,
		require,
	});
	return cjsModule.exports;
}

async function loadStore() {
	const settingsLimits = await loadTsModule("lib/settingsLimits.ts", {
		"./types": {},
	});

	return loadTsModule("store/timetableStore.ts", {
		zustand: { create },
		"zustand/middleware": { persist },
		"@/lib/types": {},
		"@/lib/settingsLimits": settingsLimits,
	});
}

function resetStore(useTimetableStore) {
	useTimetableStore.setState({
		settings: {
			classesPerDay: 5,
			daysPerWeek: 5,
			maxClassesPerSubjectPerDay: 2,
			integralShiftPriority: "Manhã",
		},
		subjects: [],
		classrooms: [],
		teachers: [],
		timetableResult: null,
	});
}

test("addSubject stores a new subject", async () => {
	const { useTimetableStore } = await loadStore();
	resetStore(useTimetableStore);

	useTimetableStore.getState().addSubject({
		id: "subject-math",
		name: "Matemática",
	});

	assert.equal(useTimetableStore.getState().subjects.length, 1);
	assert.equal(useTimetableStore.getState().subjects[0].name, "Matemática");
});

test("addClassroom stores a new classroom with selected subjects", async () => {
	const { useTimetableStore } = await loadStore();
	resetStore(useTimetableStore);

	useTimetableStore.getState().addClassroom({
		id: "class-1",
		name: "1º Ano A",
		shift: "Manhã",
		subjects: [{ subjectId: "subject-math", weeklyClasses: 5 }],
	});

	const [classroom] = useTimetableStore.getState().classrooms;

	assert.equal(classroom.name, "1º Ano A");
	assert.equal(classroom.shift, "Manhã");
	assert.equal(classroom.subjects[0].weeklyClasses, 5);
});

test("addTeacher stores a new teacher with subject permissions and constraints", async () => {
	const { useTimetableStore } = await loadStore();
	resetStore(useTimetableStore);

	useTimetableStore.getState().addTeacher({
		id: "teacher-1",
		name: "Prof. Ana",
		allowedSubjectIds: ["subject-math"],
		subjectPriorityIds: ["subject-math"],
		maxWeeklyClasses: 20,
		canTeachAfternoon: true,
		unavailableConstraints: [{ dayOfWeek: 1, periods: [0, 1] }],
	});

	const [teacher] = useTimetableStore.getState().teachers;

	assert.equal(teacher.name, "Prof. Ana");
	assert.equal(teacher.maxWeeklyClasses, 20);
	assert.deepEqual(teacher.allowedSubjectIds, ["subject-math"]);
	assert.deepEqual(teacher.unavailableConstraints, [{ dayOfWeek: 1, periods: [0, 1] }]);
});
