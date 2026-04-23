"use client";

import { useTimetableStore } from "@/store/timetableStore";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Moon, Sun, Download, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { generateTimetable } from "@/lib/generator";

export function Header() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const state = useTimetableStore();
    const { settings, subjects, classrooms, teachers } = state;

    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importFile, setImportFile] = useState<File | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleGenerate = () => {
        if (subjects.length === 0) {
            toast.error("Nenhuma matéria cadastrada.");
            return;
        }
        if (teachers.length === 0) {
            toast.error("Nenhum professor cadastrado.");
            return;
        }
        if (classrooms.length === 0) {
            toast.error("Nenhuma sala de aula cadastrada.");
            return;
        }

        try {
            const result = generateTimetable(state);
            console.log(result);
            toast.success("Tabela de horários gerada com sucesso! Verifique o console.");
        } catch (e: any) {
            toast.error("Erro: " + e.message);
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        } catch(err) {
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

                <Button onClick={handleGenerate}>Gerar Tabela de Horários</Button>
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
