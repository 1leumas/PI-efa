"use client";

import { useState } from "react";
import { Clock, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMaxClassesPerSubjectPerDay, normalizeSettings, SETTINGS_LIMITS } from "@/lib/settingsLimits";
import { useTimetableStore } from "@/store/timetableStore";

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
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium text-muted-foreground">Regras da grade</p>
					<h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Defina limites de dias, períodos e concentração de aulas antes da geração.
					</p>
				</div>
				<Button onClick={handleSave}>
					<Save data-icon="inline-start" />
					Salvar configurações
				</Button>
			</div>

			<div className="grid gap-3 md:grid-cols-3">
				<div className="rounded-md border bg-background p-4">
					<p className="text-sm text-muted-foreground">Aulas por turno</p>
					<p className="mt-1 text-2xl font-semibold">{localSettings.classesPerDay}</p>
				</div>
				<div className="rounded-md border bg-background p-4">
					<p className="text-sm text-muted-foreground">Dias letivos</p>
					<p className="mt-1 text-2xl font-semibold">{localSettings.daysPerWeek}</p>
				</div>
				<div className="rounded-md border bg-background p-4">
					<p className="text-sm text-muted-foreground">Capacidade por turma</p>
					<p className="mt-1 text-2xl font-semibold">{totalWeekly}</p>
					<p className="mt-1 text-xs text-muted-foreground">aulas/sem por turno</p>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle>Parâmetros do horário escolar</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-5">
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
								<p className="text-xs text-muted-foreground">Número de períodos por turno, manhã ou tarde.</p>
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
								<p className="text-xs text-muted-foreground">Dias letivos por semana, máximo {SETTINGS_LIMITS.maxDaysPerWeek}.</p>
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
									Evita concentrar muitas aulas de uma matéria no mesmo dia, máximo {getMaxClassesPerSubjectPerDay(localSettings.classesPerDay)}.
								</p>
							</div>

							<div className="grid gap-2">
								<Label>Prioridade de preenchimento - turmas integrais</Label>
								<Select
									value={localSettings.integralShiftPriority || "Manhã"}
									onValueChange={(value) => { if (value) updateLocalSettings({ ...localSettings, integralShiftPriority: value as "Manhã" | "Tarde" }); }}
								>
									<SelectTrigger className="w-full bg-background">
										<SelectValue placeholder="Selecione a prioridade" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Manhã">Preencher manhã primeiro</SelectItem>
										<SelectItem value="Tarde">Preencher tarde primeiro</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-xs text-muted-foreground">
									Define qual turno recebe prioridade ao alocar aulas em turmas integrais.
								</p>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="flex flex-col gap-4">
					<Card className="bg-muted/20">
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
								Capacidade da grade
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-3 text-sm">
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
								<span className="text-base font-bold text-primary">{totalWeekly}</span>
							</div>
							<p className="text-xs text-muted-foreground">
								{localSettings.classesPerDay} x {localSettings.daysPerWeek} = {totalWeekly} aulas.
							</p>
						</CardContent>
					</Card>

					<Card className="bg-muted/20">
						<CardHeader className="pb-2">
							<CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
								<Clock className="size-4" />
								Períodos por turno
							</CardTitle>
						</CardHeader>
						<CardContent className="flex flex-col gap-2 text-sm">
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
