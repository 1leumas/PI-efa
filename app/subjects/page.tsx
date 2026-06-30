"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { BookOpen, Pencil, PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Subject } from "@/lib/types";
import { useTimetableStore } from "@/store/timetableStore";

export default function SubjectsPage() {
	const { subjects, teachers, classrooms, addSubject, updateSubject, deleteSubject } = useTimetableStore();

	const [newSubject, setNewSubject] = useState("");
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

	const subjectsUsedByTeachers = new Set(teachers.flatMap((teacher) => teacher.allowedSubjectIds ?? [])).size;
	const subjectsUsedByClassrooms = new Set(classrooms.flatMap((classroom) => classroom.subjects.map((subject) => subject.subjectId))).size;

	const openAddDialog = () => {
		setNewSubject("");
		setIsAddDialogOpen(true);
	};

	const handleAdd = () => {
		if (!newSubject.trim()) {
			toast.error("O nome da matéria não pode ser vazio.");
			return;
		}
		addSubject({ id: uuidv4(), name: newSubject.trim() });
		setNewSubject("");
		setIsAddDialogOpen(false);
		toast.success("Matéria cadastrada!");
	};

	const handleEditSave = () => {
		if (!editingSubject?.name.trim()) {
			toast.error("O nome da matéria não pode ser vazio.");
			return;
		}
		updateSubject(editingSubject.id, { name: editingSubject.name.trim() });
		toast.success("Matéria atualizada!");
		setEditingSubject(null);
	};

	const handleDelete = (id: string) => {
		deleteSubject(id);
		toast.success("Matéria removida!");
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="flex flex-col gap-2">
					<p className="text-sm font-medium text-muted-foreground">Base curricular</p>
					<h1 className="text-3xl font-bold tracking-tight">Matérias</h1>
					<p className="max-w-2xl text-sm text-muted-foreground">
						Cadastre as disciplinas que professores lecionam e turmas recebem na grade.
					</p>
				</div>
				<Button onClick={openAddDialog}>
					<PlusCircle data-icon="inline-start" />
					Adicionar matéria
				</Button>
			</div>

			<div className="grid gap-3 md:grid-cols-3">
				<div className="rounded-md border bg-background p-4">
					<p className="text-sm text-muted-foreground">Matérias</p>
					<p className="mt-1 text-2xl font-semibold">{subjects.length}</p>
				</div>
				<div className="rounded-md border bg-background p-4">
					<p className="text-sm text-muted-foreground">Com professor</p>
					<p className="mt-1 text-2xl font-semibold">{subjectsUsedByTeachers}/{subjects.length}</p>
				</div>
				<div className="rounded-md border bg-background p-4">
					<p className="text-sm text-muted-foreground">Em turmas</p>
					<p className="mt-1 text-2xl font-semibold">{subjectsUsedByClassrooms}/{subjects.length}</p>
				</div>
			</div>

			<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Nova matéria</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-4 py-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="new-subject-name">Nome</Label>
							<Input
								id="new-subject-name"
								placeholder="Ex: Matemática"
								value={newSubject}
								onChange={(e) => setNewSubject(e.target.value)}
								onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
								autoFocus
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
							<Button onClick={handleAdd}>Adicionar</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={!!editingSubject} onOpenChange={(open) => { if (!open) setEditingSubject(null); }}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Editar matéria</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-4 py-4">
						<div className="flex flex-col gap-2">
							<Label htmlFor="edit-subject-name">Nome</Label>
							<Input
								id="edit-subject-name"
								value={editingSubject?.name ?? ""}
								onChange={(e) => setEditingSubject((prev) => prev ? { ...prev, name: e.target.value } : null)}
								onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(); }}
								autoFocus
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setEditingSubject(null)}>Cancelar</Button>
							<Button onClick={handleEditSave}>Salvar</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<div className="overflow-hidden rounded-md border bg-background">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nome</TableHead>
							<TableHead className="w-24 text-right pr-4">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{subjects.length === 0 ? (
							<TableRow>
								<TableCell colSpan={2} className="h-40 text-center">
									<div className="flex flex-col items-center gap-3 text-muted-foreground">
										<BookOpen className="size-8" />
										<div className="flex flex-col gap-1">
											<p className="font-medium text-foreground">Nenhuma matéria cadastrada.</p>
											<p className="text-sm">Comece pela primeira disciplina da escola.</p>
										</div>
										<Button onClick={openAddDialog}>Adicionar primeira matéria</Button>
									</div>
								</TableCell>
							</TableRow>
						) : subjects.map((subject) => (
							<TableRow key={subject.id}>
								<TableCell className="font-medium">{subject.name}</TableCell>
								<TableCell>
									<div className="flex justify-end gap-1">
										<Button variant="ghost" size="icon" onClick={() => setEditingSubject(subject)}>
											<Pencil />
										</Button>
										<DeleteConfirmDialog
											title="Excluir matéria?"
											description={<>Esta ação não pode ser desfeita. Isso removerá a matéria <strong>{subject.name}</strong> definitivamente do sistema.</>}
											onConfirm={() => handleDelete(subject.id)}
										/>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
