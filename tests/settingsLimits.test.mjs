import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { Script } from "node:vm";
import ts from "typescript";

async function loadSettingsLimits() {
  const source = await readFile(new URL("../lib/settingsLimits.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
	compilerOptions: {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2020,
	},
  });

  const cjsModule = { exports: {} };
  const script = new Script(outputText);
  script.runInNewContext({ exports: cjsModule.exports, module: cjsModule });
  return cjsModule.exports;
}

test("normalizeSettings caps global timetable settings", async () => {
  const { normalizeSettings } = await loadSettingsLimits();

  assert.equal(
	JSON.stringify(normalizeSettings({
		classesPerDay: 99,
		daysPerWeek: 99,
		maxClassesPerSubjectPerDay: 99,
		integralShiftPriority: "Tarde",
	})),
	JSON.stringify({
		classesPerDay: 10,
		daysPerWeek: 7,
		maxClassesPerSubjectPerDay: 20,
		integralShiftPriority: "Tarde",
	}),
  );
});

test("normalizeSettings derives the subject-per-day cap from the capped classes per day", async () => {
  const { normalizeSettings } = await loadSettingsLimits();

  assert.equal(
	normalizeSettings({
		classesPerDay: 4,
		daysPerWeek: 5,
		maxClassesPerSubjectPerDay: 99,
	}).maxClassesPerSubjectPerDay,
	8,
  );
});
