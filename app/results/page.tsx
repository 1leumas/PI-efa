"use client";

import { useTimetableStore } from "@/store/timetableStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function ResultsPage() {
    const { timetableResult, classrooms, subjects, teachers, settings } = useTimetableStore();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!timetableResult) {
            router.push('/');
        }
    }, [timetableResult, router]);

    const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || "—";
    const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || "Sem prof.";
    const getClassroomName = (id: string) => classrooms.find(c => c.id === id)?.name || "Desconhecida";

    const getDayName = (dayIndex: number) => {
        const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
        return days[dayIndex] || `Dia ${dayIndex}`;
    };

    if (!mounted || !timetableResult) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Button variant="ghost" className="mb-2 -ml-4" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Tabela de Horários Gerada</h1>
                    <p className="text-muted-foreground mt-1">Aqui estão os resultados otimizados pelo sistema.</p>
                </div>
            </div>

            <div className="space-y-8">
                {timetableResult.map((tt: any, index: number) => {
                    const cr = classrooms.find(c => c.id === tt.classroomId);
                    const shift = tt.shift || cr?.shift || 'Manhã';
                    
                    let startPeriod = 0;
                    let endPeriod = settings.classesPerDay;
                    
                    if (shift === 'Tarde') {
                        startPeriod = settings.classesPerDay;
                        endPeriod = settings.classesPerDay * 2;
                    } else if (shift === 'Integral') {
                        endPeriod = settings.classesPerDay * 2;
                    }

                    const periodsToRender = [];
                    for (let p = startPeriod; p < endPeriod; p++) {
                        periodsToRender.push(p);
                    }

                    return (
                        <Card key={tt.classroomId + index} className="overflow-hidden rounded-none shadow-sm gap-0 py-0">
                            <CardHeader className="border-b bg-transparent pt-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CardTitle className="text-xl">{getClassroomName(tt.classroomId)}</CardTitle>
                                        {tt.missingClasses && tt.missingClasses.length > 0 && (
                                            <Dialog>
                                                <DialogTrigger render={
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                        <AlertTriangle className="h-5 w-5" />
                                                    </Button>
                                                } />
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle className="text-destructive flex items-center gap-2">
                                                            <AlertTriangle className="h-5 w-5" />
                                                            Aulas Pendentes (Não couberam na grade)
                                                        </DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                        <p className="text-sm text-muted-foreground">
                                                            O algoritmo não conseguiu alocar as seguintes aulas devido a conflitos de professores ou restrições de horários/turmas.
                                                        </p>
                                                        <div className="border rounded-md divide-y">
                                                            {tt.missingClasses.map((mc: any, mci: number) => (
                                                                <div key={mci} className="flex justify-between items-center p-3 text-sm">
                                                                    <span className="font-semibold">{getSubjectName(mc.subjectId)}</span>
                                                                    <span className="bg-destructive/10 text-destructive px-2 py-1 rounded-md font-medium">
                                                                        Faltam {mc.count} aula(s)
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-foreground bg-transparent px-2 py-1 border rounded-none">
                                        <Clock className="h-4 w-4" />
                                        <span>Turno: {shift}</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-24 bg-muted/30 border-r border-b">Período</TableHead>
                                            {tt.schedule.map((day: any, dIndex: number) => (
                                                <TableHead key={`day-${dIndex}`} className="text-center min-w-[150px] border-r border-b bg-muted/30">
                                                    {getDayName(dIndex + 1)} {/* Usually index 1 is Monday */}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {periodsToRender.map((p, pIndex) => (
                                            <TableRow key={`period-${p}`}>
                                                <TableCell className="font-medium text-center border-r bg-muted/10 h-20 align-middle">
                                                    Aula {pIndex + 1}
                                                </TableCell>
                                                {tt.schedule.map((day: any, dIndex: number) => {
                                                    const slot = day[p];
                                                    return (
                                                        <TableCell key={`slot-${dIndex}-${p}`} className="text-center border-r p-0 hover:bg-muted/5 transition-colors h-20 align-middle w-[150px]">
                                                            {slot ? (
                                                                <div className="flex flex-col gap-1 items-center justify-center w-full h-full">
                                                                    <span className="font-bold text-primary">{getSubjectName(slot.subjectId)}</span>
                                                                    <span className="text-xs text-muted-foreground border bg-transparent px-2 py-0.5 rounded-none line-clamp-1 max-w-[130px]" title={getTeacherName(slot.teacherId)}>
                                                                        {getTeacherName(slot.teacherId)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center w-full h-full text-muted-foreground/30 text-sm">
                                                                    —
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    );
                })}
                
                {timetableResult.length === 0 && (
                    <div className="flex items-center justify-center p-12 border border-dashed rounded-lg text-muted-foreground">
                        Nenhum horário gerado.
                    </div>
                )}
            </div>
        </div>
    );
}