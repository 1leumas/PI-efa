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

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold tracking-tight">Configurações Globais</h1>
			<Card>
				<CardHeader>
					<CardTitle>Parâmetros do Horário Escolar</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-2">
						<Label htmlFor="classes.per.day">Quantidade de aulas por dia</Label>
						<Input
							id="classes.per.day"
							type="number"
							min={SETTINGS_LIMITS.minClassesPerDay}
							max={SETTINGS_LIMITS.maxClassesPerDay}
							value={localSettings.classesPerDay}
							onChange={(e) => updateLocalSettings({ ...localSettings, classesPerDay: Number(e.target.value) })}
						/>
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
					</div>
					<div className="grid gap-2">
						<Label htmlFor="max.classes.per.subject">Máximo de aulas da mesma matéria por dia (Para uma turma)</Label>
						<Input
							id="max.classes.per.subject"
							type="number"
							min={SETTINGS_LIMITS.minClassesPerSubjectPerDay}
							max={getMaxClassesPerSubjectPerDay(localSettings.classesPerDay)}
							value={localSettings.maxClassesPerSubjectPerDay || 2}
							onChange={(e) => updateLocalSettings({ ...localSettings, maxClassesPerSubjectPerDay: Number(e.target.value) })}
						/>
					</div>
					<div className="grid gap-2">
						<Label>Prioridade de preenchimento (Turmas Integrais)</Label>
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
					</div>
					<Button onClick={handleSave}>Salvar Configurações</Button>
				</CardContent>
			</Card>
		</div>
	);
}
