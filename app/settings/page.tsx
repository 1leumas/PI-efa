"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMaxClassesPerSubjectPerDay, normalizeSettings, SETTINGS_LIMITS } from "@/lib/settingsLimits";
import { useTimetableStore } from "@/store/timetableStore";
import { useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
	const { settings, updateSettings } = useTimetableStore();
	const [localSettings, setLocalSettings] = useState(() => normalizeSettings(settings));

	const updateLocalSettings = (nextSettings: typeof localSettings) => {
		setLocalSettings(normalizeSettings(nextSettings, localSettings));
	};

	const handleSave = () => {
		updateSettings(normalizeSettings(localSettings));
		toast.success("Configurações atualizadas!");
	};

	const totalWeekly = localSettings.classesPerDay * localSettings.daysPerWeek;

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold tracking-tight">Configurações</h1>

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle>Parâmetros do Horário Escolar</CardTitle>
						</CardHeader>
						<CardContent className="space-y-5">
							<div className="grid gap-2">
								<Label htmlFor="classes.per.day">Aulas por dia</Label>
								<Input
									id="classes.per.day"
									type="number"
									min={SETTINGS_LIMITS.minClassesPerDay}
									max={SETTINGS_LIMITS.maxClassesPerDay}
									value={localSettings.classesPerDay}
									onChange={(e) => updateLocalSettings({ ...localSettings, classesPerDay: Number(e.target.value) })}
								/>
								<p className="text-xs text-muted-foreground">Número de períodos por turno (manhã ou tarde).</p>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="days.per.week">Dias de aula por semana</Label>
								<Input
									id="days.per.week"
									type="number"
									min={SETTINGS_LIMITS.minDaysPerWeek}
									max={SETTINGS_LIMITS.maxDaysPerWeek}
									value={localSettings.daysPerWeek}
									onChange={(e) => updateLocalSettings({ ...localSettings, daysPerWeek: Number(e.target.value) })}
								/>
								<p className="text-xs text-muted-foreground">Dias letivos por semana (máx. {SETTINGS_LIMITS.maxDaysPerWeek}).</p>
							</div>

							<div className="grid gap-2">
								<Label htmlFor="max.classes.per.subject">Máx. aulas da mesma disciplina por dia</Label>
								<Input
									id="max.classes.per.subject"
									type="number"
									min={SETTINGS_LIMITS.minClassesPerSubjectPerDay}
									max={getMaxClassesPerSubjectPerDay(localSettings.classesPerDay)}
									value={localSettings.maxClassesPerSubjectPerDay || 2}
									onChange={(e) => updateLocalSettings({ ...localSettings, maxClassesPerSubjectPerDay: Number(e.target.value) })}
								/>
								<p className="text-xs text-muted-foreground">
									Evita concentrar muitas aulas de uma matéria no mesmo dia (máx. {getMaxClassesPerSubjectPerDay(localSettings.classesPerDay)}).
								</p>
							</div>

							<div className="grid gap-2">
								<Label>Prioridade de preenchimento — Turmas Integrais</Label>
								<Select
									value={localSettings.integralShiftPriority || "Manhã"}
									onValueChange={(v) => { if (v) updateLocalSettings({ ...localSettings, integralShiftPriority: v as "Manhã" | "Tarde" }); }}
								>
									<SelectTrigger className="bg-background w-full">
										<SelectValue placeholder="Selecione a prioridade" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Manhã">Preencher Manhã primeiro</SelectItem>
										<SelectItem value="Tarde">Preencher Tarde primeiro</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">
									Define qual turno recebe prioridade ao alocar aulas em turmas integrais.
								</p>
							</div>

							<Button onClick={handleSave}>Salvar Configurações</Button>
						</CardContent>
					</Card>
				</div>

				{/* Resumo */}
				<div className="space-y-4">
					<Card className="bg-muted/20">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
								Capacidade da Grade
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Aulas / dia</span>
								<span className="font-semibold">{localSettings.classesPerDay}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Dias / semana</span>
								<span className="font-semibold">{localSettings.daysPerWeek}</span>
							</div>
							<div className="flex justify-between border-t pt-3">
								<span className="text-muted-foreground">Máx. aulas / semana por turma</span>
								<span className="font-bold text-primary text-base">{totalWeekly}</span>
							</div>
							<p className="text-xs text-muted-foreground">
								{localSettings.classesPerDay} × {localSettings.daysPerWeek} = {totalWeekly} aulas — limite máximo de uma disciplina por turma.
							</p>
						</CardContent>
					</Card>

					<Card className="bg-muted/20">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
								Períodos por Turno
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">Manhã</span>
								<span className="font-semibold">{localSettings.classesPerDay} períodos</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">Tarde</span>
								<span className="font-semibold">{localSettings.classesPerDay} períodos</span>
							</div>
							<div className="flex justify-between border-t pt-2">
								<span className="text-muted-foreground">Integral</span>
								<span className="font-semibold">{localSettings.classesPerDay * 2} períodos</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
