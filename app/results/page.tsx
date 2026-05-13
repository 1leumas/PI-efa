"use client";

import { useTimetableStore } from "@/store/timetableStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MissingClass, TimetableClassroomResult, TimetableSlot } from "@/lib/types";

export default function ResultsPage() {
	const { timetableResult, classrooms, subjects, teachers, settings } = useTimetableStore();
	const router = useRouter();
	const [selectedId, setSelectedId] = useState<string | null>(null);

	useEffect(() => {
		if (!timetableResult) {
			router.push("/");
		} else if (timetableResult.length > 0 && !selectedId) {
			setSelectedId(timetableResult[0].classroomId);
		}
	}, [timetableResult, router, selectedId]);

	const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || "—";
	const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || "Sem prof.";
	const getClassroomName = (id: string) => classrooms.find(c => c.id === id)?.name || "Desconhecida";

	const getDayName = (dayIndex: number) => {
		const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
		return days[dayIndex] || `Dia ${dayIndex}`;
	};

	if (!timetableResult) return null;

	const activeResult = timetableResult.find(tt => tt.classroomId === selectedId) ?? timetableResult[0];

	const renderTimetable = (tt: TimetableClassroomResult) => {
		const shift = tt.shift || classrooms.find(c => c.id === tt.classroomId)?.shift || "Manhã";

		let startPeriod = 0;
		let endPeriod = settings.classesPerDay;

		if (shift === "Tarde") {
			startPeriod = settings.classesPerDay;
			endPeriod = settings.classesPerDay * 2;
		} else if (shift === "Integral") {
			endPeriod = settings.classesPerDay * 2;
		}

		const periodsToRender: number[] = [];
		for (let p = startPeriod; p < endPeriod; p++) {
			periodsToRender.push(p);
		}

		return (
			<Card className="overflow-hidden shadow-sm">
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
												Aulas Pendentes
											</DialogTitle>
										</DialogHeader>
										<div className="space-y-4 py-4">
											<p className="text-sm text-muted-foreground">
												O algoritmo não conseguiu alocar as seguintes aulas devido a conflitos de professores ou restrições de horário.
											</p>
											<div className="border rounded-md divide-y">
												{tt.missingClasses.map((mc: MissingClass, mci: number) => (
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
						<div className="flex items-center gap-2 text-sm text-muted-foreground border rounded-md px-3 py-1">
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
								{tt.schedule.map((_day: (TimetableSlot | null)[], dIndex: number) => (
									<TableHead key={`day-${dIndex}`} className="text-center min-w-[150px] border-r border-b bg-muted/30">
										{getDayName(dIndex + 1)}
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
									{tt.schedule.map((day: (TimetableSlot | null)[], dIndex: number) => {
										const slot = day[p];
										return (
											<TableCell key={`slot-${dIndex}-${p}`} className="text-center border-r p-0 hover:bg-muted/5 transition-colors h-20 align-middle w-[150px]">
												{slot ? (
													<div className="flex flex-col gap-1 items-center justify-center w-full h-full">
														<span className="font-bold text-primary">{getSubjectName(slot.subjectId)}</span>
														<span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md line-clamp-1 max-w-[130px]" title={getTeacherName(slot.teacherId)}>
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
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Button variant="ghost" className="mb-2 -ml-4" onClick={() => router.back()}>
						<ArrowLeft className="mr-2 h-4 w-4" /> Voltar
					</Button>
					<h1 className="text-3xl font-bold tracking-tight">Tabela de Horários</h1>
					<p className="text-muted-foreground mt-1">
						{timetableResult.length} {timetableResult.length === 1 ? "turma gerada" : "turmas geradas"}
					</p>
				</div>
			</div>

			{timetableResult.length === 0 ? (
				<div className="flex items-center justify-center p-12 border border-dashed rounded-lg text-muted-foreground">
					Nenhum horário gerado.
				</div>
			) : (
				<div className="space-y-4">
					{/* Seletor de turmas */}
					<div className="flex flex-wrap gap-2 border-b pb-4">
						{timetableResult.map((tt) => {
							const hasMissing = tt.missingClasses && tt.missingClasses.length > 0;
							const isActive = tt.classroomId === (selectedId ?? timetableResult[0].classroomId);
							return (
								<button
									key={tt.classroomId}
									onClick={() => setSelectedId(tt.classroomId)}
									className={cn(
										"relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors border",
										isActive
											? "bg-primary text-primary-foreground border-primary"
											: "bg-background hover:bg-muted border-border text-foreground"
									)}
								>
									{getClassroomName(tt.classroomId)}
									{hasMissing && (
										<span className={cn(
											"inline-flex items-center justify-center rounded-full w-4 h-4 text-[10px] font-bold",
											isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-destructive/15 text-destructive"
										)}>
											!
										</span>
									)}
								</button>
							);
						})}
					</div>

					{/* Grade da turma selecionada */}
					{activeResult && renderTimetable(activeResult)}
				</div>
			)}
		</div>
	);
}
