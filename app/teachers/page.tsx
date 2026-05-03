"use client";

import { useTimetableStore } from "@/store/timetableStore";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, ChevronUp, ChevronDown } from "lucide-react";
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
	}>({ name: "", maxWeeklyClasses: 20, canTeachAfternoon: false, allowedSubjectIds: [], unavailableConstraints: [] });

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
			setFormData({ name: "", maxWeeklyClasses: 20, canTeachAfternoon: false, allowedSubjectIds: [], unavailableConstraints: [] });
		}
		setIsDialogOpen(true);
	};

	const handleSave = () => {
		if (!formData.name.trim()) return toast.error("Nome inválido");

		if (editingId) {
			updateTeacher(editingId, { ...formData, subjectPriorityIds: formData.allowedSubjectIds });
			toast.success("Professor(a) atualizado!");
		} else {
			addTeacher({
				id: uuidv4(),
				...formData,
				subjectPriorityIds: formData.allowedSubjectIds
			});
			toast.success("Professor(a) adicionado!");
		}
		setIsDialogOpen(false);
	};

	const toggleSubject = (subjectId: string) => {
		setFormData((prev) => {
			const allowed = prev.allowedSubjectIds;
			if (allowed.includes(subjectId)) {
				return { ...prev, allowedSubjectIds: allowed.filter((id) => id !== subjectId) };
			} else {
				return { ...prev, allowedSubjectIds: [...allowed, subjectId] };
			}
		});
	};

	const toggleFullDay = (dayValue: number) => {
		setFormData(prev => {
			const existing = prev.unavailableConstraints.find(c => c.dayOfWeek === dayValue);
			const totalPeriods = settings.classesPerDay;

			// if all are unavailable, make them all available.
			if (existing && existing.periods.length === totalPeriods) {
				return {
					...prev,
					unavailableConstraints: prev.unavailableConstraints.filter(c => c.dayOfWeek !== dayValue)
				};
			}

			// otherwise, make them all unavailable.
			const allPeriods = Array.from({ length: totalPeriods }, (_, i) => i);
			const newConstraints = prev.unavailableConstraints.filter(c => c.dayOfWeek !== dayValue);
			newConstraints.push({ dayOfWeek: dayValue, periods: allPeriods });

			return {
				...prev,
				unavailableConstraints: newConstraints
			};
		});
	};

	const moveSubjectUp = (index: number) => {
		if (index === 0) return;
		setFormData((prev) => {
			const newAllowed = [...prev.allowedSubjectIds];
			[newAllowed[index - 1], newAllowed[index]] = [newAllowed[index], newAllowed[index - 1]];
			return { ...prev, allowedSubjectIds: newAllowed };
		});
	};

	const moveSubjectDown = (index: number) => {
		if (index === formData.allowedSubjectIds.length - 1) return;
		setFormData((prev) => {
			const newAllowed = [...prev.allowedSubjectIds];
			[newAllowed[index], newAllowed[index + 1]] = [newAllowed[index + 1], newAllowed[index]];
			return { ...prev, allowedSubjectIds: newAllowed };
		});
	};

	const toggleGridCell = (day: number, period: number) => {
		setFormData(prev => {
			const existing = prev.unavailableConstraints.find(c => c.dayOfWeek === day);
			if (existing) {
				const p = existing.periods;
				let newPeriods;
				if (p.includes(period)) {
					newPeriods = p.filter(x => x !== period);
				} else {
					newPeriods = [...p, period].sort();
				}
				return {
					...prev,
					unavailableConstraints: prev.unavailableConstraints
						.map(c => c.dayOfWeek === day ? { ...c, periods: newPeriods } : c)
						.filter(c => c.periods.length > 0)
				};
			} else {
				return {
					...prev,
					unavailableConstraints: [...prev.unavailableConstraints, { dayOfWeek: day, periods: [period] }]
				};
			}
		});
	};

	const getDayName = (dayValue: number) => {
		const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
		return days[dayValue] || "";
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold tracking-tight">Corpo Docente</h1>
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger render={<Button onClick={() => handleOpenDialog()} />}>
						Adicionar Professor
					</DialogTrigger>
					<DialogContent className="sm:max-w-[95vw] w-[95vw] h-[95vh] overflow-y-auto overflow-x-hidden">
						<DialogHeader>
							<DialogTitle>{editingId ? "Editar Professor" : "Novo Professor"}</DialogTitle>
						</DialogHeader>
						<div className="space-y-6 py-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label>Nome</Label>
									<Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
								</div>
								<div className="space-y-2">
									<Label>Máximo de Aulas / Semana</Label>
									<Input type="number" min="1" value={formData.maxWeeklyClasses} onChange={e => setFormData({ ...formData, maxWeeklyClasses: parseInt(e.target.value) || 20 })} />
								</div>
								<div className="space-y-2 flex flex-col justify-center">
									<Label>Tempo Integral</Label>
									<div className="flex items-center space-x-2 pt-2">
										<Checkbox
											id="can-teach-afternoon"
											checked={formData.canTeachAfternoon}
											onCheckedChange={(c) => setFormData({ ...formData, canTeachAfternoon: !!c })}
										/>
										<Label htmlFor="can-teach-afternoon" className="cursor-pointer font-normal text-sm">Pode lecionar à tarde</Label>
									</div>
								</div>
							</div>

							<div className="space-y-4">
								<Label className="text-base font-semibold">Disciplinas e Prioridade</Label>
								<div className="grid grid-cols-2 gap-6">
									<div className="space-y-3">
										<Label className="text-sm text-muted-foreground">Selecione as disciplinas:</Label>
										{subjects.length === 0 ? (
											<p className="text-sm text-muted-foreground">Nenhuma disciplina cadastrada.</p>
										) : (
											<div className="grid grid-cols-1 gap-4 p-4 rounded-md max-h-48">
												<DropdownMenu>
													<DropdownMenuTrigger render={<Button variant="outline" className="w-full justify-between bg-background" />}>
														Selecionar Disciplinas ({formData.allowedSubjectIds.length})
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
											</div>
										)}
									</div>
									<div className="space-y-3">
										<Label className="text-sm text-muted-foreground">Ordem de Prioridade:</Label>
										{formData.allowedSubjectIds.length === 0 ? (
											<div className="border border-dashed rounded-md p-4 text-center text-sm text-muted-foreground h-48 flex items-center justify-center">
												Selecione disciplinas ao lado para definir prioridade.
											</div>
										) : (
											<div className="space-y-2 border p-2 rounded-md h-48 overflow-y-auto">
												{formData.allowedSubjectIds.map((subId, idx) => {
													const sub = subjects.find(s => s.id === subId);
													return (
														<div key={subId} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
															<span className="text-sm px-2 truncate">{sub?.name || "Desconhecida"}</span>
															<div className="flex bg-background border rounded-md">
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-6 w-6"
																	disabled={idx === 0}
																	onClick={(e) => { e.preventDefault(); moveSubjectUp(idx); }}
																>
																	<ChevronUp className="h-4 w-4" />
																</Button>
																<Button
																	variant="ghost"
																	size="icon"
																	className="h-6 w-6"
																	disabled={idx === formData.allowedSubjectIds.length - 1}
																	onClick={(e) => { e.preventDefault(); moveSubjectDown(idx); }}
																>
																	<ChevronDown className="h-4 w-4" />
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

							<div className="space-y-3">
								<Label className="text-base font-semibold">Agenda de Indisponibilidade</Label>
								<p className="text-sm text-muted-foreground">
									Clique nos blocos (ou no cabeçalho do dia) para marcar o professor como <span className="text-destructive font-medium">indisponível</span>.
								</p>
								<div className="border rounded-md overflow-hidden">
									<Table className="table-fixed">
										<TableHeader>
											<TableRow>
												<TableHead className="w-20 text-center border-r">Aula</TableHead>
												{Array.from({ length: settings.daysPerWeek }).map((_, i) => {
													const dayValue = i + 1; // Segunda = 1
													return (
														<TableHead key={dayValue} className="p-0 border-r last:border-0 h-10 w-full" style={{ padding: 0 }}>
															<Button
																variant="ghost"
																className="w-full h-full font-bold rounded-none hover:bg-muted/50 justify-center"
																onClick={() => toggleFullDay(dayValue)}
																title="Indisponibilizar / Disponibilizar dia inteiro"
															>
																{getDayName(dayValue)}
															</Button>
														</TableHead>
													);
												})}
											</TableRow>
										</TableHeader>
										<TableBody>
											{Array.from({ length: settings.classesPerDay }).map((_, periodIndex) => (
												<TableRow key={periodIndex}>
													<TableCell className="text-center font-medium bg-muted/30 border-r h-14">
														{periodIndex + 1}ª
													</TableCell>
													{Array.from({ length: settings.daysPerWeek }).map((_, i) => {
														const dayValue = i + 1;
														const isUnavailable = formData.unavailableConstraints
															.find(c => c.dayOfWeek === dayValue)?.periods.includes(periodIndex);
														return (
															<TableCell key={dayValue} className="p-0 border-l h-14">
																<Button
																	type="button"
																	variant={isUnavailable ? "destructive" : "outline"}
																	className={`w-full h-full rounded-none transition-colors ${!isUnavailable ? "bg-emerald-500/10 text-emerald-600 border-none hover:bg-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400" : "border-none"}`}
																	onClick={() => toggleGridCell(dayValue, periodIndex)}
																>
																	{isUnavailable ? "Indisponível" : "Disponível"}
																</Button>
															</TableCell>
														);
													})}
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>

							<div className="flex justify-end space-x-2 pt-4">
								<Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
								<Button onClick={handleSave}>Salvar Configurações</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			<div className="border rounded-md">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead>Máx Aulas</TableHead>
							<TableHead>Dá Aula à Tarde?</TableHead>
							<TableHead className="w-25">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{teachers.map((t) => (
							<TableRow key={t.id}>
								<TableCell>{t.name}</TableCell>
								<TableCell>{t.maxWeeklyClasses}</TableCell>
								<TableCell>{t.canTeachAfternoon ? "Sim" : "Não"}</TableCell>
								<TableCell className="flex gap-2">
									<Button variant="ghost" size="icon" onClick={() => handleOpenDialog(t)}><Pencil className="h-4 w-4" /></Button>
									<DeleteConfirmDialog
										title="Excluir Professor(a)?"
										description={<>Esta ação não pode ser desfeita. O(A) professor(a) <strong>{t.name}</strong> será apagado(a) permanentemente.</>}
										onConfirm={() => { deleteTeacher(t.id); toast.success("Professor(a) excluído(a)!"); }}
									/>
								</TableCell>
							</TableRow>
						))}
						{teachers.length === 0 && (
							<TableRow>
								<TableCell colSpan={3} className="text-center text-muted-foreground h-24">
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
