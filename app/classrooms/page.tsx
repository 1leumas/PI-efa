"use client";

import { useTimetableStore } from "@/store/timetableStore";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Classroom, ClassroomSubject } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function ClassroomsPage() {
    const { classrooms, subjects, addClassroom, updateClassroom, deleteClassroom } = useTimetableStore();
    const [mounted, setMounted] = useState(false);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<{
        name: string;
        selectedSubjects: Map<string, number>;
    }>({ name: "", selectedSubjects: new Map() });

    useEffect(() => setMounted(true), []);

    const handleOpenDialog = (classroom?: Classroom) => {
        if (classroom) {
            setEditingId(classroom.id);
            const subjectsMap = new Map<string, number>();
            classroom.subjects.forEach((s) => subjectsMap.set(s.subjectId, s.weeklyClasses));
            setFormData({ name: classroom.name, selectedSubjects: subjectsMap });
        } else {
            setEditingId(null);
            setFormData({ name: "", selectedSubjects: new Map() });
        }
        setIsDialogOpen(true);
    };

    const handleSave = () => {
        if (!formData.name.trim()) return toast.error("Nome inválido");

        const subjectsArray: ClassroomSubject[] = Array.from(formData.selectedSubjects.entries()).map(
            ([subjectId, weeklyClasses]) => ({ subjectId, weeklyClasses })
        );

        if (editingId) {
            updateClassroom(editingId, { name: formData.name, subjects: subjectsArray });
            toast.success("Turma atualizada!");
        } else {
            addClassroom({ id: uuidv4(), name: formData.name, subjects: subjectsArray });
            toast.success("Turma criada!");
        }
        setIsDialogOpen(false);
    };

    const toggleSubject = (subjectId: string, checked: boolean) => {
        const newSubjects = new Map(formData.selectedSubjects);
        if (checked) {
            newSubjects.set(subjectId, 1);
        } else {
            newSubjects.delete(subjectId);
        }
        setFormData({ ...formData, selectedSubjects: newSubjects });
    };

    const updateWeeklyClasses = (subjectId: string, classes: number) => {
        const newSubjects = new Map(formData.selectedSubjects);
        if (newSubjects.has(subjectId)) {
            newSubjects.set(subjectId, classes);
            setFormData({ ...formData, selectedSubjects: newSubjects });
        }
    };

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Turmas</h1>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger render={<Button onClick={() => handleOpenDialog()} />}>
                        Adicionar Turma
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[95vw] md:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Editar Turma" : "Nova Turma"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label className="text-base font-semibold">Nome da Turma</Label>
                                <Input placeholder="Ex: 1º Ano A" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <Label className="text-base font-semibold">Disciplinas e Aulas Semanais</Label>
                                    <p className="text-sm text-muted-foreground mr-auto sm:ml-4">
                                        Selecione a disciplina e defina a carga horária.
                                    </p>
                                </div>
                                {subjects.length === 0 ? (
                                    <div className="border border-dashed rounded-md p-8 text-center text-muted-foreground">
                                        Nenhuma disciplina cadastrada ainda.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border rounded-md p-4 max-h-[50vh] overflow-y-auto bg-muted/10">
                                        {subjects.map((subject) => {
                                            const isSelected = formData.selectedSubjects.has(subject.id);
                                            const classesCount = formData.selectedSubjects.get(subject.id) || 1;
                                            return (
                                                <div key={subject.id} className={`flex flex-col p-3 border rounded-md transition-all ${isSelected ? 'bg-background border-primary ring-1 ring-primary/20 shadow-sm' : 'bg-background/50 border-border opacity-70 hover:opacity-100 hover:bg-background'}`}>
                                                    <div className="flex items-center space-x-3">
                                                        <Checkbox id={`subject-${subject.id}`} checked={isSelected} onCheckedChange={(c) => toggleSubject(subject.id, c as boolean)} />
                                                        <Label htmlFor={`subject-${subject.id}`} className="flex-1 cursor-pointer font-medium leading-tight select-none">
                                                            {subject.name}
                                                        </Label>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="mt-4 flex items-center justify-between pl-7">
                                                            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Aulas/Semana</span>
                                                            <div className="flex items-center shadow-sm">
                                                                <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-r-none" onClick={() => updateWeeklyClasses(subject.id, Math.max(1, classesCount - 1))}>-</Button>
                                                                <Input
                                                                    id={`classes-${subject.id}`}
                                                                    type="number"
                                                                    min={1}
                                                                    className="w-12 h-7 rounded-none border-x-0 text-center text-sm focus-visible:ring-0 focus-visible:ring-offset-0 px-1 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                                                    value={classesCount}
                                                                    onChange={(e) => updateWeeklyClasses(subject.id, parseInt(e.target.value) || 1)}
                                                                />
                                                                <Button type="button" variant="outline" size="icon" className="h-7 w-7 rounded-l-none" onClick={() => updateWeeklyClasses(subject.id, classesCount + 1)}>+</Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end pt-4 border-t">
                                <Button onClick={handleSave} className="min-w-32">Salvar Turma</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classrooms.map((c) => (
                    <Card key={c.id}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xl">{c.name}</CardTitle>
                            <div className="flex space-x-1">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(c)}><Pencil className="h-4 w-4" /></Button>
                                <DeleteConfirmDialog
                                    title="Excluir Turma?"
                                    description={<>Esta ação não pode ser desfeita. A turma <strong>{c.name}</strong> será apagada permanentemente do sistema.</>}
                                    onConfirm={() => { deleteClassroom(c.id); toast.success("Turma excluída!"); }}
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{c.subjects.length} matérias cadastradas.</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
