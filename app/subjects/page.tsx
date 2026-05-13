"use client";

import { useTimetableStore } from "@/store/timetableStore";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Pencil } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Subject } from "@/lib/types";

export default function SubjectsPage() {
	const { subjects, addSubject, updateSubject, deleteSubject } = useTimetableStore();

	const [newSubject, setNewSubject] = useState("");
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

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
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-3xl font-bold tracking-tight">Matérias</h1>

				<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
					<DialogTrigger render={<Button />}>
						<PlusCircle className="mr-2 h-4 w-4" />
						Adicionar Matéria
					</DialogTrigger>
					<DialogContent className="sm:max-w-md">
						<DialogHeader>
							<DialogTitle>Nova Matéria</DialogTitle>
						</DialogHeader>
						<div className="py-4 space-y-4">
							<div className="space-y-2">
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
			</div>

			{/* Dialog de edição */}
			<Dialog open={!!editingSubject} onOpenChange={(open) => { if (!open) setEditingSubject(null); }}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Editar Matéria</DialogTitle>
					</DialogHeader>
					<div className="py-4 space-y-4">
						<div className="space-y-2">
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

			<div className="border rounded-md">
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
								<TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
									Nenhuma matéria cadastrada.
								</TableCell>
							</TableRow>
						) : subjects.map((subject) => (
							<TableRow key={subject.id}>
								<TableCell className="font-medium">{subject.name}</TableCell>
								<TableCell>
									<div className="flex justify-end gap-1">
										<Button variant="ghost" size="icon" onClick={() => setEditingSubject(subject)}>
											<Pencil className="h-4 w-4" />
										</Button>
										<DeleteConfirmDialog
											title="Excluir Matéria?"
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
