"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Clock, GraduationCap, Layers3, Pencil, PlusCircle } from "lucide-react";

import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Teacher, TeacherTimeConstraint } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTimetableStore } from "@/store/timetableStore";

export default function TeachersPage() {
	const { teachers, addTeacher, updateTeacher, deleteTeacher, subjects, settings } = useTimetableStore();
	const totalWeeklyClasses = teachers.reduce((sum, teacher) => sum + teacher.maxWeeklyClasses, 0);
	const coveredSubjectIds = new Set(teachers.flatMap((teacher) => teacher.allowedSubjectIds ?? []));
	const afternoonTeachers = teachers.filter((teacher) => teacher.canTeachAfternoon).length;

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
			if (allowed.includes(subjectId)) return { ...prev, allowedSubjectIds: allowed.filter((id) => id !== subjectId) };
			return { ...prev, allowedSubjectIds: [...allowed, subjectId] };
		});
	};

	const toggleFullDay = (dayValue: number) => {
		setFormData((prev) => {
			const totalPeriods = settings.classesPerDay * (prev.canTeachAfternoon ? 2 : 1);
			const existing = prev.unavailableConstraints.find((c) => c.dayOfWeek === dayValue);
			if (existing && existing.periods.length === totalPeriods) {
				return { ...prev, unavailableConstraints: prev.unavailableConstraints.filter((c) => c.dayOfWeek !== dayValue) };
			}
			const newConstraints = prev.unavailableConstraints.filter((c) => c.dayOfWeek !== dayValue);
			newConstraints.push({ dayOfWeek: dayValue, periods: Array.from({ length: totalPeriods }, (_, i) => i) });
			return { ...prev, unavailableConstraints: newConstraints };
		});
	};

	const moveSubject = (index: number, direction: -1 | 1) => {
		setFormData((prev) => {
			const nextIndex = index + direction;
			if (nextIndex < 0 || nextIndex >= prev.allowedSubjectIds.length) return prev;
			const arr = [...prev.allowedSubjectIds];
			[arr[index], arr[nextIndex]] = [arr[nextIndex], arr[index]];
			return { ...prev, allowedSubjectIds: arr };
		});
	};

	const toggleGridCell = (day: number, period: number) => {
		setFormData((prev) => {
			const existing = prev.unavailableConstraints.find((c) => c.dayOfWeek === day);
			if (existing) {
				const newPeriods = existing.periods.includes(period)
					? existing.periods.filter((x) => x !== period)
					: [...existing.periods, period].sort((a, b) => a - b);
				return {
					...prev,
					unavailableConstraints: prev.unavailableConstraints
						.map((c) => c.dayOfWeek === day ? { ...c, periods: newPeriods } : c)
						.filter((c) => c.periods.length > 0),
				};
			}
			return { ...prev, unavailableConstraints: [...prev.unavailableConstraints, { dayOfWeek: day, periods: [period] }] };
		});
	};

	const getDayName = (dayValue: number) => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][dayValue] ?? `D${dayValue}`;
	const getDayFullName = (dayValue: number) => ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][dayValue] ?? `Dia ${dayValue}`;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium text-muted-foreground">Equipe pedagógica</p>
					<h1 className="text-3xl font-bold tracking-tight">Corpo docente</h1>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Cadastre professores, disciplinas e horários bloqueados antes de gerar a grade.
					</p>
				</div>
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<button type="button" className={buttonVariants()} onClick={() => handleOpenDialog()}>
						<PlusCircle data-icon="inline-start" />
						Adicionar professor
					</button>
					<DialogContent className="flex h-[95vh] w-[95vw] flex-col overflow-hidden sm:max-w-[95vw]">
						<DialogHeader>
							<DialogTitle>{editingId ? "Editar professor" : "Novo professor"}</DialogTitle>
						</DialogHeader>

						<div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden py-4">
							<section className="rounded-lg border bg-muted/20 p-4">
								<div className="mb-4 flex items-center gap-2">
									<GraduationCap className="size-4 text-muted-foreground" />
									<h2 className="text-sm font-semibold">Dados básicos</h2>
								</div>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
									<div className="flex flex-col gap-2">
										<Label>Nome</Label>
										<Input placeholder="Ex: Maria Silva" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
									</div>
									<div className="flex flex-col gap-2">
										<Label>Máx. aulas / semana</Label>
										<Input
											type="number"
											min="1"
											value={formData.maxWeeklyClasses}
											onChange={(e) => setFormData({ ...formData, maxWeeklyClasses: parseInt(e.target.value) || 20 })}
										/>
									</div>
									<div className="flex flex-col justify-end pb-0.5">
										<div className="flex h-9 items-center gap-2">
											<Checkbox
												id="can-teach-afternoon"
												checked={formData.canTeachAfternoon}
												onCheckedChange={(checked) => setFormData({ ...formData, canTeachAfternoon: !!checked })}
											/>
											<Label htmlFor="can-teach-afternoon" className="cursor-pointer text-sm font-normal">
												Pode lecionar à tarde
											</Label>
										</div>
									</div>
								</div>
							</section>

							<section className="rounded-lg border bg-muted/20 p-4">
								<div className="mb-4 flex items-center gap-2">
									<Layers3 className="size-4 text-muted-foreground" />
									<h2 className="text-sm font-semibold">Disciplinas</h2>
								</div>
								<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
									<div className="flex flex-col gap-2">
										<Label className="text-sm text-muted-foreground">Quais disciplinas leciona:</Label>
										{subjects.length === 0 ? (
											<p className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
												Nenhuma disciplina cadastrada.
											</p>
										) : (
											<DropdownMenu>
												<DropdownMenuTrigger render={<Button variant="outline" className="w-full justify-between bg-background" />}>
													{formData.allowedSubjectIds.length === 0
														? "Selecionar disciplinas..."
														: `${formData.allowedSubjectIds.length} disciplina(s) selecionada(s)`}
													<ChevronDown data-icon="inline-end" />
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
									<div className="flex flex-col gap-2">
										<Label className="text-sm text-muted-foreground">
											Prioridade <span className="font-normal opacity-60">(reordene com as setas)</span>:
										</Label>
										{formData.allowedSubjectIds.length === 0 ? (
											<div className="flex h-[72px] items-center justify-center rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
												Selecione disciplinas ao lado
											</div>
										) : (
											<div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border p-2">
												{formData.allowedSubjectIds.map((subId, idx) => {
													const sub = subjects.find((s) => s.id === subId);
													return (
														<div key={subId} className="flex items-center justify-between rounded bg-background px-2 py-1 text-sm ring-1 ring-border">
															<span className="w-4 shrink-0 text-xs text-muted-foreground">{idx + 1}.</span>
															<span className="mx-1 flex-1 truncate">{sub?.name ?? "-"}</span>
															<div className="flex shrink-0">
																<Button variant="ghost" size="icon-xs" disabled={idx === 0} onClick={(e) => { e.preventDefault(); moveSubject(idx, -1); }}>
																	<ChevronUp />
																</Button>
																<Button variant="ghost" size="icon-xs" disabled={idx === formData.allowedSubjectIds.length - 1} onClick={(e) => { e.preventDefault(); moveSubject(idx, 1); }}>
																	<ChevronDown />
																</Button>
															</div>
														</div>
													);
												})}
											</div>
										)}
									</div>
								</div>
							</section>

							<section className="rounded-lg border bg-muted/20 p-4">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div className="flex flex-col gap-1">
										<div className="flex items-center gap-2">
											<Clock className="size-4 text-muted-foreground" />
											<Label className="text-sm font-semibold">Indisponibilidade</Label>
										</div>
										<p className="text-xs text-muted-foreground">
											Clique nas células para marcar quando o professor <strong>não pode</strong> dar aula.
											Clique no nome do dia para bloquear o dia inteiro.
										</p>
									</div>
									<div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
										<span className="flex items-center gap-1.5">
											<span className="inline-block size-3 rounded-sm border border-primary/30 bg-primary/10" />
											Disponível
										</span>
										<span className="flex items-center gap-1.5">
											<span className="inline-block size-3 rounded-sm border border-destructive/50 bg-destructive/20" />
											Indisponível
										</span>
									</div>
								</div>

								<div className="mt-3 w-full overflow-auto rounded-md border bg-background">
									<Table className="w-full table-fixed">
										<TableHeader>
											<TableRow>
												<TableHead className="w-14 border-r text-center text-xs">Aula</TableHead>
												{Array.from({ length: settings.daysPerWeek }).map((_, i) => {
													const dayValue = i + 1;
													return (
														<TableHead key={dayValue} className="border-r p-0 last:border-0">
															<Button
																variant="ghost"
																className="h-full w-full justify-center rounded-none py-2 text-xs font-semibold hover:bg-muted/50"
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
											<TableRow>
												<TableCell colSpan={settings.daysPerWeek + 1} className="border-b bg-muted/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest">
													Manhã
												</TableCell>
											</TableRow>
											{Array.from({ length: settings.classesPerDay }).map((_, periodIndex) => (
												<TableRow key={`m-${periodIndex}`}>
													<TableCell className="h-9 border-r bg-muted/10 text-center text-xs font-medium">{periodIndex + 1}ª</TableCell>
													{Array.from({ length: settings.daysPerWeek }).map((_, i) => {
														const dayValue = i + 1;
														const isUnavailable = !!formData.unavailableConstraints.find((c) => c.dayOfWeek === dayValue)?.periods.includes(periodIndex);
														return (
															<TableCell key={dayValue} className="h-9 border-l p-0">
																<Button
																	type="button"
																	variant={isUnavailable ? "destructive" : "ghost"}
																	className={cn("h-9 w-full rounded-none border-none transition-colors", !isUnavailable && "bg-primary/10 hover:bg-primary/15")}
																	onClick={() => toggleGridCell(dayValue, periodIndex)}
																/>
															</TableCell>
														);
													})}
												</TableRow>
											))}

											<TableRow>
												<TableCell
													colSpan={settings.daysPerWeek + 1}
													className={cn("border-y px-3 py-1 text-[10px] font-semibold uppercase tracking-widest", formData.canTeachAfternoon ? "bg-muted/40" : "bg-muted/20 text-muted-foreground")}
												>
													Tarde
													{!formData.canTeachAfternoon && (
														<span className="ml-1 font-normal normal-case tracking-normal opacity-60">
															- habilite &quot;Pode lecionar à tarde&quot;
														</span>
													)}
												</TableCell>
											</TableRow>
											{Array.from({ length: settings.classesPerDay }).map((_, periodIndex) => {
												const actualPeriod = settings.classesPerDay + periodIndex;
												const canAfternoon = formData.canTeachAfternoon;
												return (
													<TableRow key={`a-${periodIndex}`} className={!canAfternoon ? "pointer-events-none opacity-40" : ""}>
														<TableCell className="h-9 border-r bg-muted/10 text-center text-xs font-medium">{periodIndex + 1}ª</TableCell>
														{Array.from({ length: settings.daysPerWeek }).map((_, i) => {
															const dayValue = i + 1;
															const isUnavailable = !!formData.unavailableConstraints.find((c) => c.dayOfWeek === dayValue)?.periods.includes(actualPeriod);
															return (
																<TableCell key={dayValue} className="h-9 border-l p-0">
																	<Button
																		type="button"
																		variant={isUnavailable ? "destructive" : "ghost"}
																		disabled={!canAfternoon}
																		className={cn("h-9 w-full rounded-none border-none transition-colors", !isUnavailable && "bg-primary/10 hover:bg-primary/15")}
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
							</section>
						</div>

						<div className="flex shrink-0 justify-end gap-2 border-t pt-2">
							<Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
							<Button onClick={handleSave}>Salvar</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			<div className="grid gap-3 md:grid-cols-3">
				<div className="rounded-md border bg-background p-4">
					<p className="text-sm text-muted-foreground">Professores</p>
					<p className="mt-1 text-2xl font-semibold">{teachers.length}</p>
				</div>
				<div className="rounded-md border bg-background p-4">
					<p className="text-sm text-muted-foreground">Capacidade semanal</p>
					<p className="mt-1 text-2xl font-semibold">{totalWeeklyClasses}</p>
				</div>
				<div className="rounded-md border bg-background p-4">
					<p className="text-sm text-muted-foreground">Disciplinas cobertas</p>
					<p className="mt-1 text-2xl font-semibold">{coveredSubjectIds.size}/{subjects.length}</p>
					<p className="mt-1 text-xs text-muted-foreground">{afternoonTeachers} com tarde liberada</p>
				</div>
			</div>

			<div className="overflow-hidden rounded-md border bg-background">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>Disciplinas</TableHead>
							<TableHead className="w-24">Máx/Sem</TableHead>
							<TableHead className="w-16">Tarde</TableHead>
							<TableHead className="w-20 text-right">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{teachers.map((teacher) => {
							const subjectNames = (teacher.allowedSubjectIds ?? [])
								.map((id) => subjects.find((subject) => subject.id === id)?.name)
								.filter(Boolean) as string[];
							return (
								<TableRow key={teacher.id}>
									<TableCell className="font-medium">{teacher.name}</TableCell>
									<TableCell>
										{subjectNames.length === 0 ? (
											<span className="text-xs italic text-muted-foreground">Nenhuma</span>
										) : (
											<div className="flex flex-wrap gap-1">
												{subjectNames.slice(0, 3).map((name) => (
													<span key={name} className="rounded border bg-muted/50 px-1.5 py-0.5 text-xs">{name}</span>
												))}
												{subjectNames.length > 3 && <span className="text-xs text-muted-foreground">+{subjectNames.length - 3}</span>}
											</div>
										)}
									</TableCell>
									<TableCell>{teacher.maxWeeklyClasses}</TableCell>
									<TableCell>{teacher.canTeachAfternoon ? "Sim" : "Não"}</TableCell>
									<TableCell>
										<div className="flex justify-end gap-1">
											<Button variant="ghost" size="icon" onClick={() => handleOpenDialog(teacher)}>
												<Pencil />
											</Button>
											<DeleteConfirmDialog
												title="Excluir professor(a)?"
												description={<>Esta ação não pode ser desfeita. O(A) professor(a) <strong>{teacher.name}</strong> será apagado(a) permanentemente.</>}
												onConfirm={() => { deleteTeacher(teacher.id); toast.success("Professor(a) excluído(a)!"); }}
											/>
										</div>
									</TableCell>
								</TableRow>
							);
						})}
						{teachers.length === 0 && (
							<TableRow>
								<TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
