"use client";

import { useTimetableStore } from "@/store/timetableStore";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Moon, Sun, Download, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import { ChangeEvent, useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { generateTimetable } from "@/lib/generator";
import { useRouter } from "next/navigation";

export function Header() {
	const { theme, setTheme } = useTheme();
	const router = useRouter();
	const [isGenerating, setIsGenerating] = useState(false);

	const state = useTimetableStore();
	const { settings, subjects, classrooms, teachers, setTimetableResult } = state;

	const [isImportModalOpen, setImportModalOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [importFile, setImportFile] = useState<File | null>(null);

	const handleGenerate = async () => {
		if (subjects.length === 0) return toast.error("Nenhuma matéria cadastrada.");
		if (teachers.length === 0) return toast.error("Nenhum professor cadastrado.");
		if (classrooms.length === 0) return toast.error("Nenhuma sala de aula cadastrada.");

		try {
			setIsGenerating(true);
			// Simulate a brief delay to show the nice loading state and prevent screen flickering
			await new Promise((resolve) => setTimeout(resolve, 800));

			const result = generateTimetable(state);
			setTimetableResult(result);

			toast.success("Tabela de horários gerada com sucesso!");
			router.push("/results");
		} catch (e: unknown) {
			const message = e instanceof Error ? e.message : "Erro desconhecido";
			toast.error("Erro: " + message);
		} finally {
			setIsGenerating(false);
		}
	};

	const handleExport = () => {
		const data = JSON.stringify({ settings, subjects, classrooms, teachers }, null, 2);
		const blob = new Blob([data], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "timetable_data.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		toast.success("Dados exportados!");
	};

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setImportFile(e.target.files[0]);
		}
	};

	const handleImport = async (mode: 'replace' | 'merge') => {
		if (!importFile) return;
		try {
			const text = await importFile.text();
			const data = JSON.parse(text);
			state.importData(data, mode);
			toast.success(`Dados importados com sucesso (${mode === 'replace' ? 'Substituído' : 'Mesclado'})!`);
			setImportModalOpen(false);
			setImportFile(null);
		} catch {
			toast.error("Erro ao ler o arquivo. Certifique-se de que é um JSON válido.");
		}
	};

	return (
		<header className="h-14 flex items-center justify-between border-b px-6 bg-background">
			<div className="flex items-center md:hidden">
				<span className="font-bold text-lg">Horários</span>
			</div>
			<div className="flex-1" />
			<div className="flex items-center gap-4">
				<Button variant="outline" size="icon" className="relative" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
					<Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Alternar tema</span>
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger render={<Button variant="outline" />}>
						<Download className="mr-2 h-4 w-4" /> Dados
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={handleExport} className="cursor-pointer">
							<Download className="mr-2 h-4 w-4" />
							Exportar
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setImportModalOpen(true)} className="cursor-pointer">
							<Upload className="mr-2 h-4 w-4" />
							Importar
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>

				<Button onClick={handleGenerate} disabled={isGenerating}>
					{isGenerating ? (
						<>
							<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Gerando...
						</>
					) : "Gerar Tabela de Horários"}
				</Button>
			</div>

			<Dialog open={isImportModalOpen} onOpenChange={(open) => { setImportModalOpen(open); if (!open) setImportFile(null); }}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Importar Dados</DialogTitle>
						<DialogDescription>
							Selecione um arquivo JSON de backup para importar as configurações, disciplinas, turmas e professores.
						</DialogDescription>
					</DialogHeader>

					<div className="py-4 space-y-4">
						<div className="flex flex-col gap-2">
							<input
								type="file"
								accept=".json"
								ref={fileInputRef}
								onChange={handleFileChange}
								className="hidden"
							/>
							<Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
								{importFile ? importFile.name : "Selecionar Arquivo JSON"}
							</Button>
						</div>
					</div>

					<DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between items-center">
						<Button variant="ghost" onClick={() => setImportModalOpen(false)} className="w-full sm:w-auto">
							Cancelar
						</Button>
						<div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
							<Button
								variant="destructive"
								disabled={!importFile}
								onClick={() => handleImport('replace')}
								className="w-full sm:w-auto bg-destructive/90 text-white"
							>
								Substituir Tudo
							</Button>
							<Button
								variant="secondary"
								disabled={!importFile}
								onClick={() => handleImport('merge')}
								className="w-full sm:w-auto"
							>
								Mesclar
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</header>
	);
}
