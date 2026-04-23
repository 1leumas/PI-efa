"use client";

import { useTimetableStore } from "@/store/timetableStore";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Moon, Sun, Download, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { generateTimetable } from "@/lib/generator";

export function Header() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const state = useTimetableStore();
    const { settings, subjects, classrooms, teachers } = state;

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
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Exportar
                </Button>
                <Button onClick={handleGenerate}>Gerar Tabela de Horários</Button>
            </div>
        </header>
    );
}
