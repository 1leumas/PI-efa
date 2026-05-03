"use client";

import { useTimetableStore } from "@/store/timetableStore";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";
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

export default function SubjectsPage() {
	const { subjects, addSubject, deleteSubject } = useTimetableStore();
	const [newSubject, setNewSubject] = useState("");
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

	const handleAdd = () => {
		if (!newSubject.trim()) {
			toast.error("O nome da matéria não pode ser vazio.");
			return;
		}

		addSubject({ id: uuidv4(), name: newSubject });
		setNewSubject("");
		setIsAddDialogOpen(false);
		toast.success("Matéria cadastrada!");
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
					<DialogContent className="sm:max-w-106.25">
						<DialogHeader>
							<DialogTitle>Nova Matéria</DialogTitle>
						</DialogHeader>
						<div className="py-4 space-y-4">
							<div className="space-y-2">
								<Input
									placeholder="Nome da Matéria (ex: Matemática)"
									value={newSubject}
									onChange={(e) => setNewSubject(e.target.value)}
									onKeyDown={(e) => {
										if (e.key === 'Enter') handleAdd();
									}}
									autoFocus
								/>
							</div>
							<div className="flex justify-end gap-2">
								<Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
								<Button onClick={handleAdd}>Salvar</Button>
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
							<TableHead className="w-25">Ações</TableHead>
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
									<DeleteConfirmDialog
										title="Excluir Matéria?"
										description={<>Esta ação não pode ser desfeita. Isso removerá a matéria <strong>{subject.name}</strong> definitivamente do sistema.</>}
										onConfirm={() => handleDelete(subject.id)}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
