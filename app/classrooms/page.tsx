"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Building, Pencil, PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Classroom, ClassroomSubject, ShiftType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTimetableStore } from "@/store/timetableStore";

export default function ClassroomsPage() {
	const { classrooms, subjects, addClassroom, updateClassroom, deleteClassroom, settings } = useTimetableStore();
	const maxWeeklyClasses = settings.classesPerDay * settings.daysPerWeek;
	const totalSubjectsInClassrooms = classrooms.reduce((sum, classroom) => sum + classroom.subjects.length, 0);
	const integralClassrooms = classrooms.filter((classroom) => classroom.shift === "Integral").length;

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	const [formData, setFormData] = useState<{
		name: string;
		shift: ShiftType;
		selectedSubjects: Map<string, number>;
	}>({ name: "", shift: "Manhã", selectedSubjects: new Map() });

	const handleOpenDialog = (classroom?: Classroom) => {
		if (classroom) {
			setEditingId(classroom.id);
			const subjectsMap = new Map<string, number>();
			classroom.subjects.forEach((subject) => subjectsMap.set(subject.subjectId, subject.weeklyClasses));
			setFormData({ name: classroom.name, shift: classroom.shift || "Manhã", selectedSubjects: subjectsMap });
		} else {
			setEditingId(null);
			setFormData({ name: "", shift: "Manhã", selectedSubjects: new Map() });
		}
		setIsDialogOpen(true);
	};

	const handleSave = () => {
		if (!formData.name.trim()) return toast.error("Nome inválido");

		const subjectsArray: ClassroomSubject[] = Array.from(formData.selectedSubjects.entries()).map(
			([subjectId, weeklyClasses]) => ({ subjectId, weeklyClasses })
		);

		if (editingId) {
			updateClassroom(editingId, { name: formData.name, shift: formData.shift, subjects: subjectsArray });
			toast.success("Turma atualizada!");
		} else {
			addClassroom({ id: uuidv4(), name: formData.name, shift: formData.shift, subjects: subjectsArray });
			toast.success("Turma criada!");
		}
		setIsDialogOpen(false);
	};

	const toggleSubject = (subjectId: string, checked: boolean) => {
		const newSubjects = new Map(formData.selectedSubjects);
		if (checked) newSubjects.set(subjectId, 1);
		else newSubjects.delete(subjectId);
		setFormData({ ...formData, selectedSubjects: newSubjects });
	};

	const updateWeeklyClasses = (subjectId: string, classes: number) => {
		const newSubjects = new Map(formData.selectedSubjects);
		if (newSubjects.has(subjectId)) {
			newSubjects.set(subjectId, classes);
			setFormData({ ...formData, selectedSubjects: newSubjects });
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium text-muted-foreground">Oferta por sala</p>
					<h1 className="text-3xl font-bold tracking-tight">Turmas</h1>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Monte cada turma com turno, disciplinas e quantidade de aulas semanais.
					</p>
				</div>
				<Button onClick={() => handleOpenDialog()}>
					<PlusCircle data-icon="inline-start" />
					Adicionar turma
				</Button>
			</div>

			<div className="grid gap-3 md:grid-cols-3">
				<div className="rounded-md border bg-background p-4">
					<p className="text-sm text-muted-foreground">Turmas</p>
					<p className="mt-1 text-2xl font-semibold">{classrooms.length}</p>
				</div>
				<div className="rounded-md border bg-background p-4">
					<p className="text-sm text-muted-foreground">Disciplinas vinculadas</p>
					<p className="mt-1 text-2xl font-semibold">{totalSubjectsInClassrooms}</p>
				</div>
				<div className="rounded-md border bg-background p-4">
					<p className="text-sm text-muted-foreground">Integrais</p>
					<p className="mt-1 text-2xl font-semibold">{integralClassrooms}</p>
					<p className="mt-1 text-xs text-muted-foreground">{maxWeeklyClasses} aulas/sem por turno</p>
				</div>
			</div>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[95vw] md:max-w-3xl lg:max-w-4xl">
					<DialogHeader>
						<DialogTitle>{editingId ? "Editar turma" : "Nova turma"}</DialogTitle>
					</DialogHeader>
					<div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto py-4">
						<section className="rounded-lg border bg-muted/20 p-4">
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="flex flex-col gap-2">
									<Label>Nome da turma</Label>
									<Input
										placeholder="Ex: 1º Ano A"
										value={formData.name}
										onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									/>
								</div>
								<div className="flex flex-col gap-2">
									<Label>Turno</Label>
									<Select
										value={formData.shift}
										onValueChange={(value) => { if (value) setFormData({ ...formData, shift: value as ShiftType }); }}
									>
										<SelectTrigger className="w-full bg-background" size="default">
											<SelectValue placeholder="Selecione o turno" />
										</SelectTrigger>
										<SelectContent className="z-[200] max-h-56 w-(--anchor-width) bg-popover text-popover-foreground shadow-md" side="bottom" align="start" sideOffset={4} alignItemWithTrigger={false}>
											<SelectItem value="Manhã">Manhã</SelectItem>
											<SelectItem value="Tarde">Tarde</SelectItem>
											<SelectItem value="Integral">Integral</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</section>

						<section className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<Label className="text-sm font-semibold">Disciplinas e aulas semanais</Label>
								<span className="text-xs text-muted-foreground">
									Capacidade máxima: <strong className="text-foreground">{maxWeeklyClasses} aulas/sem</strong>
								</span>
							</div>

							{subjects.length === 0 ? (
								<div className="rounded-md border border-dashed bg-background p-8 text-center text-muted-foreground">
									Nenhuma disciplina cadastrada ainda.
								</div>
							) : (
								<div className="grid max-h-[50vh] grid-cols-1 gap-3 overflow-y-auto rounded-md border bg-background p-4 md:grid-cols-2 lg:grid-cols-3">
									{subjects.map((subject) => {
										const isSelected = formData.selectedSubjects.has(subject.id);
										const classesCount = formData.selectedSubjects.get(subject.id) || 1;
										return (
											<div key={subject.id} className={cn("flex flex-col rounded-md border p-3 transition-all", isSelected ? "border-primary bg-muted/30 ring-1 ring-primary/20" : "bg-background opacity-80 hover:opacity-100")}>
												<div className="flex items-center gap-3">
													<Checkbox
														id={`subject-${subject.id}`}
														checked={isSelected}
														onCheckedChange={(checked) => toggleSubject(subject.id, !!checked)}
													/>
													<Label htmlFor={`subject-${subject.id}`} className="flex-1 cursor-pointer select-none font-medium leading-tight">
														{subject.name}
													</Label>
												</div>

												{isSelected && (
													<div className="mt-4 flex items-center justify-between pl-7">
														<span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Aulas/Semana</span>
														<div className="flex items-center overflow-hidden rounded-md border bg-background shadow-sm">
															<Button type="button" variant="ghost" size="icon" className="size-7 rounded-none border-r" onClick={() => updateWeeklyClasses(subject.id, Math.max(1, classesCount - 1))}>-</Button>
															<Input
																id={`classes-${subject.id}`}
																type="number"
																min={1}
																className="h-7 w-12 rounded-none border-0 bg-transparent px-1 text-center text-sm focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
																value={classesCount}
																onChange={(e) => updateWeeklyClasses(subject.id, parseInt(e.target.value) || 1)}
															/>
															<Button type="button" variant="ghost" size="icon" className="size-7 rounded-none border-l" onClick={() => updateWeeklyClasses(subject.id, classesCount + 1)}>+</Button>
														</div>
													</div>
												)}
											</div>
										);
									})}
								</div>
							)}
						</section>
					</div>
					<div className="flex shrink-0 justify-end gap-2 border-t pt-2">
						<Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
						<Button onClick={handleSave}>Salvar turma</Button>
					</div>
				</DialogContent>
			</Dialog>

			{classrooms.length === 0 ? (
				<div className="rounded-md border border-dashed bg-background p-12 text-center">
					<div className="mx-auto flex max-w-md flex-col items-center gap-3 text-muted-foreground">
						<Building className="size-8" />
						<div className="flex flex-col gap-1">
							<p className="font-medium text-foreground">Nenhuma turma cadastrada.</p>
							<p className="text-sm">Crie uma turma e vincule as matérias que ela terá na semana.</p>
						</div>
						<Button onClick={() => handleOpenDialog()}>Adicionar primeira turma</Button>
					</div>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{classrooms.map((classroom) => {
						const totalWeekly = classroom.subjects.reduce((sum, subject) => sum + subject.weeklyClasses, 0);
						const shift = classroom.shift ?? "Manhã";
						return (
							<Card key={classroom.id}>
								<CardHeader className="flex flex-row items-start justify-between pb-2">
									<div className="flex flex-col gap-1">
										<CardTitle className="text-xl">{classroom.name}</CardTitle>
										<span className="text-sm font-medium text-muted-foreground">{shift}</span>
									</div>
									<div className="flex shrink-0 gap-1">
										<Button variant="ghost" size="icon" onClick={() => handleOpenDialog(classroom)}>
											<Pencil />
										</Button>
										<DeleteConfirmDialog
											title="Excluir turma?"
											description={<>Esta ação não pode ser desfeita. A turma <strong>{classroom.name}</strong> será apagada permanentemente do sistema.</>}
											onConfirm={() => { deleteClassroom(classroom.id); toast.success("Turma excluída!"); }}
										/>
									</div>
								</CardHeader>
								<CardContent className="flex flex-col gap-1">
									<p className="text-sm text-muted-foreground">
										{classroom.subjects.length === 0
											? "Nenhuma disciplina"
											: `${classroom.subjects.length} ${classroom.subjects.length === 1 ? "disciplina" : "disciplinas"}`}
									</p>
									{classroom.subjects.length > 0 && (
										<p className="text-sm">
											<span className="font-semibold">{totalWeekly}</span>
											<span className="text-muted-foreground"> / {maxWeeklyClasses} aulas/sem</span>
										</p>
									)}
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
