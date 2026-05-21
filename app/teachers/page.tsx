"use client";

import { useTimetableStore } from "@/store/timetableStore";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, ChevronUp, ChevronDown, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Teacher, TeacherTimeConstraint } from "@/lib/types";

export default function TeachersPage() {
	const { teachers, addTeacher, updateTeacher, deleteTeacher, subjects, settings } = useTimetableStore();

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const [formData, setFormData] = useState<{
		name: string;
		maxWeeklyClasses: number;
		canTeachAfternoon: boolean;
		allowedSubjectIds: string[];
		unavailableConstraints: TeacherTimeConstraint[];
	}>({ name: "", maxWeeklyClasses: 20, canTeachAfternoon: true, allowedSubjectIds: [], unavailableConstraints: [] });

	const handleOpenDialog = (teacher?: Teacher) => {
		if (teacher) {
			setEditingId(teacher.id);
			setFormData({
				name: teacher.name,
				maxWeeklyClasses: teacher.maxWeeklyClasses,
				canTeachAfternoon: !!teacher.canTeachAfternoon,
				allowedSubjectIds: [...(teacher.allowedSubjectIds || [])],
				unavailableConstraints: teacher.unavailableConstraints ? JSON.parse(JSON.stringify(teacher.unavailableConstraints)) : [],
			});
		} else {
			setEditingId(null);
			setFormData({ name: "", maxWeeklyClasses: 20, canTeachAfternoon: true, allowedSubjectIds: [], unavailableConstraints: [] });
		}
		setIsDialogOpen(true);
	};

	const handleSave = () => {
		if (!formData.name.trim()) return toast.error("Nome inválido");
		if (editingId) {
			updateTeacher(editingId, { ...formData, subjectPriorityIds: formData.allowedSubjectIds });
			toast.success("Professor(a) atualizado!");
		} else {
			addTeacher({ id: uuidv4(), ...formData, subjectPriorityIds: formData.allowedSubjectIds });
			toast.success("Professor(a) adicionado!");
		}
		setIsDialogOpen(false);
	};

	const toggleSubject = (subjectId: string) => {
		setFormData((prev) => {
			const allowed = prev.allowedSubjectIds;
			if (allowed.includes(subjectId)) {
				return { ...prev, allowedSubjectIds: allowed.filter((id) => id !== subjectId) };
			}
			return { ...prev, allowedSubjectIds: [...allowed, subjectId] };
		});
	};

	const toggleFullDay = (dayValue: number) => {
		setFormData(prev => {
			const existing = prev.unavailableConstraints.find(c => c.dayOfWeek === dayValue);
			const totalPeriods = settings.classesPerDay;
			if (existing && existing.periods.length === totalPeriods) {
				return { ...prev, unavailableConstraints: prev.unavailableConstraints.filter(c => c.dayOfWeek !== dayValue) };
			}
			const allPeriods = Array.from({ length: totalPeriods }, (_, i) => i);
			const newConstraints = prev.unavailableConstraints.filter(c => c.dayOfWeek !== dayValue);
			newConstraints.push({ dayOfWeek: dayValue, periods: allPeriods });
			return { ...prev, unavailableConstraints: newConstraints };
		});
	};

	const moveSubjectUp = (index: number) => {
		if (index === 0) return;
		setFormData((prev) => {
			const arr = [...prev.allowedSubjectIds];
			[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
			return { ...prev, allowedSubjectIds: arr };
		});
	};

	const moveSubjectDown = (index: number) => {
		if (index === formData.allowedSubjectIds.length - 1) return;
		setFormData((prev) => {
			const arr = [...prev.allowedSubjectIds];
			[arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
			return { ...prev, allowedSubjectIds: arr };
		});
	};

	const toggleGridCell = (day: number, period: number) => {
		setFormData(prev => {
			const existing = prev.unavailableConstraints.find(c => c.dayOfWeek === day);
			if (existing) {
				const p = existing.periods;
				const newPeriods = p.includes(period) ? p.filter(x => x !== period) : [...p, period].sort((a, b) => a - b);
				return {
					...prev,
					unavailableConstraints: prev.unavailableConstraints
						.map(c => c.dayOfWeek === day ? { ...c, periods: newPeriods } : c)
						.filter(c => c.periods.length > 0),
				};
			}
			return { ...prev, unavailableConstraints: [...prev.unavailableConstraints, { dayOfWeek: day, periods: [period] }] };
		});
	};

	const getDayName = (dayValue: number) => {
		const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
		return days[dayValue] ?? `D${dayValue}`;
	};

	const getDayFullName = (dayValue: number) => {
		const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
		return days[dayValue] ?? `Dia ${dayValue}`;
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold tracking-tight">Corpo Docente</h1>
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger render={<Button onClick={() => handleOpenDialog()} />}>
						<PlusCircle className="mr-2 h-4 w-4" />
						Adicionar Professor
					</DialogTrigger>
					<DialogContent className="sm:max-w-[95vw] w-[95vw] h-[95vh] flex flex-col overflow-hidden">
						<DialogHeader>
							<DialogTitle>{editingId ? "Editar Professor" : "Novo Professor"}</DialogTitle>
						</DialogHeader>
						<div className="space-y-6 py-4 flex-1 overflow-y-auto overflow-x-hidden min-h-0">

							{/* Dados básicos */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label>Nome</Label>
									<Input
										placeholder="Ex: Maria Silva"
										value={formData.name}
										onChange={e => setFormData({ ...formData, name: e.target.value })}
									/>
								</div>
								<div className="space-y-2">
									<Label>Máx. aulas / semana</Label>
									<Input
										type="number"
										min="1"
										value={formData.maxWeeklyClasses}
										onChange={e => setFormData({ ...formData, maxWeeklyClasses: parseInt(e.target.value) || 20 })}
									/>
								</div>
								<div className="flex flex-col justify-end pb-0.5">
									<div className="flex items-center space-x-2 h-9">
										<Checkbox
											id="can-teach-afternoon"
											checked={formData.canTeachAfternoon}
											onCheckedChange={(c) => setFormData({ ...formData, canTeachAfternoon: !!c })}
										/>
										<Label htmlFor="can-teach-afternoon" className="cursor-pointer font-normal text-sm">
											Pode lecionar à tarde
										</Label>
									</div>
								</div>
							</div>

							{/* Disciplinas */}
							<div className="space-y-3">
								<Label className="text-base font-semibold">Disciplinas</Label>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div className="space-y-2">
										<Label className="text-sm text-muted-foreground">Quais disciplinas leciona:</Label>
										{subjects.length === 0 ? (
											<p className="text-sm text-muted-foreground border border-dashed rounded-md p-3 text-center">
												Nenhuma disciplina cadastrada.
											</p>
										) : (
											<DropdownMenu>
												<DropdownMenuTrigger render={<Button variant="outline" className="w-full justify-between bg-background" />}>
													{formData.allowedSubjectIds.length === 0
														? "Selecionar disciplinas…"
														: `${formData.allowedSubjectIds.length} disciplina(s) selecionada(s)`}
													<ChevronDown className="h-4 w-4 opacity-50" />
												</DropdownMenuTrigger>
												<DropdownMenuContent className="w-56" align="start">
													{subjects.map((subject) => (
														<DropdownMenuCheckboxItem
															key={subject.id}
															checked={formData.allowedSubjectIds.includes(subject.id)}
															onCheckedChange={() => toggleSubject(subject.id)}
														>
															{subject.name}
														</DropdownMenuCheckboxItem>
													))}
												</DropdownMenuContent>
											</DropdownMenu>
										)}
									</div>
									<div className="space-y-2">
										<Label className="text-sm text-muted-foreground">
											Prioridade <span className="font-normal opacity-60">(reordene com as setas)</span>:
										</Label>
										{formData.allowedSubjectIds.length === 0 ? (
											<div className="border border-dashed rounded-md p-3 text-center text-sm text-muted-foreground h-[72px] flex items-center justify-center">
												Selecione disciplinas ao lado
											</div>
										) : (
											<div className="space-y-1 border rounded-md p-2 max-h-40 overflow-y-auto">
												{formData.allowedSubjectIds.map((subId, idx) => {
													const sub = subjects.find(s => s.id === subId);
													return (
														<div key={subId} className="flex items-center justify-between bg-muted/30 px-2 py-1 rounded text-sm">
															<span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
															<span className="truncate flex-1 mx-1">{sub?.name ?? "—"}</span>
															<div className="flex shrink-0">
																<Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === 0} onClick={(e) => { e.preventDefault(); moveSubjectUp(idx); }}>
																	<ChevronUp className="h-3 w-3" />
																</Button>
																<Button variant="ghost" size="icon" className="h-5 w-5" disabled={idx === formData.allowedSubjectIds.length - 1} onClick={(e) => { e.preventDefault(); moveSubjectDown(idx); }}>
																	<ChevronDown className="h-3 w-3" />
																</Button>
															</div>
														</div>
													);
												})}
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Grade de indisponibilidade */}
							<div className="space-y-3">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div>
										<Label className="text-base font-semibold">Indisponibilidade</Label>
										<p className="text-xs text-muted-foreground mt-0.5">
											Clique nas células para marcar quando o professor <strong>não pode</strong> dar aula.
											Clique no nome do dia para bloquear o dia inteiro.
										</p>
									</div>
									<div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
										<span className="flex items-center gap-1.5">
											<span className="inline-block w-3 h-3 rounded-sm bg-emerald-500/25 border border-emerald-500/50" />
											Disponível
										</span>
										<span className="flex items-center gap-1.5">
											<span className="inline-block w-3 h-3 rounded-sm bg-destructive/20 border border-destructive/50" />
											Indisponível
										</span>
									</div>
								</div>

								<div className="border rounded-md overflow-auto w-full">
									<Table className="table-fixed w-full">
										<TableHeader>
											<TableRow>
												<TableHead className="w-14 text-center border-r text-xs">Aula</TableHead>
												{Array.from({ length: settings.daysPerWeek }).map((_, i) => {
													const dayValue = i + 1;
													return (
														<TableHead key={dayValue} className="p-0 border-r last:border-0">
															<Button
																variant="ghost"
																className="w-full h-full font-semibold rounded-none hover:bg-muted/50 justify-center text-xs py-2"
																onClick={() => toggleFullDay(dayValue)}
																title={`Bloquear/liberar ${getDayFullName(dayValue)}`}
															>
																{getDayName(dayValue)}
															</Button>
														</TableHead>
													);
												})}
											</TableRow>
										</TableHeader>
										<TableBody>
											{/* Manhã */}
											<TableRow>
												<TableCell
													colSpan={settings.daysPerWeek + 1}
													className="py-1 px-3 bg-sky-50 dark:bg-sky-950/20 text-sky-700 dark:text-sky-400 text-[10px] font-semibold uppercase tracking-widest border-b"
												>
													Manhã
												</TableCell>
											</TableRow>
											{Array.from({ length: settings.classesPerDay }).map((_, periodIndex) => (
												<TableRow key={`m-${periodIndex}`}>
													<TableCell className="text-center text-xs font-medium border-r h-9 bg-muted/10">
														{periodIndex + 1}ª
													</TableCell>
													{Array.from({ length: settings.daysPerWeek }).map((_, i) => {
														const dayValue = i + 1;
														const isUnavailable = !!formData.unavailableConstraints
															.find(c => c.dayOfWeek === dayValue)?.periods.includes(periodIndex);
														return (
															<TableCell key={dayValue} className="p-0 border-l h-9">
																<Button
																	type="button"
																	variant={isUnavailable ? "destructive" : "ghost"}
																	className={`w-full h-9 rounded-none border-none transition-colors ${!isUnavailable ? "bg-emerald-500/15 hover:bg-emerald-500/25" : ""}`}
																	onClick={() => toggleGridCell(dayValue, periodIndex)}
																/>
															</TableCell>
														);
													})}
												</TableRow>
											))}

											{/* Tarde */}
											<TableRow>
												<TableCell
													colSpan={settings.daysPerWeek + 1}
													className={`py-1 px-3 text-[10px] font-semibold uppercase tracking-widest border-b border-t ${
														formData.canTeachAfternoon
															? "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
															: "bg-muted/20 text-muted-foreground"
													}`}
												>
													Tarde
													{!formData.canTeachAfternoon && (
														<span className="font-normal normal-case tracking-normal opacity-60 ml-1">
															— habilite &quot;Pode lecionar à tarde&quot;
														</span>
													)}
												</TableCell>
											</TableRow>
											{Array.from({ length: settings.classesPerDay }).map((_, periodIndex) => {
												const actualPeriod = settings.classesPerDay + periodIndex;
												const canAfternoon = formData.canTeachAfternoon;
												return (
													<TableRow key={`a-${periodIndex}`} className={!canAfternoon ? "opacity-40 pointer-events-none" : ""}>
														<TableCell className="text-center text-xs font-medium border-r h-9 bg-muted/10">
															{periodIndex + 1}ª
														</TableCell>
														{Array.from({ length: settings.daysPerWeek }).map((_, i) => {
															const dayValue = i + 1;
															const isUnavailable = !!formData.unavailableConstraints
																.find(c => c.dayOfWeek === dayValue)?.periods.includes(actualPeriod);
															return (
																<TableCell key={dayValue} className="p-0 border-l h-9">
																	<Button
																		type="button"
																		variant={isUnavailable ? "destructive" : "ghost"}
																		disabled={!canAfternoon}
																		className={`w-full h-9 rounded-none border-none transition-colors ${!isUnavailable ? "bg-emerald-500/15 hover:bg-emerald-500/25" : ""}`}
																		onClick={() => toggleGridCell(dayValue, actualPeriod)}
																	/>
																</TableCell>
															);
														})}
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							</div>

						</div>
						<div className="flex justify-end gap-2 pt-2 border-t shrink-0">
							<Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
							<Button onClick={handleSave}>Salvar</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Tabela de professores */}
			<div className="border rounded-md">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>Disciplinas</TableHead>
							<TableHead className="w-24">Máx/Sem</TableHead>
							<TableHead className="w-16">Tarde</TableHead>
							<TableHead className="w-20">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{teachers.map((t) => {
							const subjectNames = (t.allowedSubjectIds ?? [])
								.map(id => subjects.find(s => s.id === id)?.name)
								.filter(Boolean) as string[];
							return (
								<TableRow key={t.id}>
									<TableCell className="font-medium">{t.name}</TableCell>
									<TableCell>
										{subjectNames.length === 0 ? (
											<span className="text-xs text-muted-foreground italic">Nenhuma</span>
										) : (
											<div className="flex flex-wrap gap-1">
												{subjectNames.slice(0, 3).map((name, i) => (
													<span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded">{name}</span>
												))}
												{subjectNames.length > 3 && (
													<span className="text-xs text-muted-foreground">+{subjectNames.length - 3}</span>
												)}
											</div>
										)}
									</TableCell>
									<TableCell>{t.maxWeeklyClasses}</TableCell>
									<TableCell>{t.canTeachAfternoon ? "Sim" : "Não"}</TableCell>
									<TableCell className="flex gap-1">
										<Button variant="ghost" size="icon" onClick={() => handleOpenDialog(t)}>
											<Pencil className="h-4 w-4" />
										</Button>
										<DeleteConfirmDialog
											title="Excluir Professor(a)?"
											description={<>Esta ação não pode ser desfeita. O(A) professor(a) <strong>{t.name}</strong> será apagado(a) permanentemente.</>}
											onConfirm={() => { deleteTeacher(t.id); toast.success("Professor(a) excluído(a)!"); }}
										/>
									</TableCell>
								</TableRow>
							);
						})}
						{teachers.length === 0 && (
							<TableRow>
								<TableCell colSpan={5} className="text-center text-muted-foreground h-24">
									Nenhum professor cadastrado.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
