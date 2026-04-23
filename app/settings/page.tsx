"use client";

import { useTimetableStore } from "@/store/timetableStore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
    const { settings, updateSettings } = useTimetableStore();
    const [localSettings, setLocalSettings] = useState(settings);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setLocalSettings(settings);
        setMounted(true);
    }, [settings]);

    const handleSave = () => {
        updateSettings(localSettings);
        toast.success("Configurações atualizadas!");
    };

    if (!mounted) return null;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Configurações Globais</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Parâmetros do Horário Escolar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="classes.per.day">Quantidade de aulas por dia</Label>
                        <Input
                            id="classes.per.day"
                            type="number"
                            value={localSettings.classesPerDay}
                            onChange={(e) => setLocalSettings({ ...localSettings, classesPerDay: Number(e.target.value) })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="days.per.week">Dias de aula por semana</Label>
                        <Input
                            id="days.per.week"
                            type="number"
                            max={7}
                            value={localSettings.daysPerWeek}
                            onChange={(e) => setLocalSettings({ ...localSettings, daysPerWeek: Number(e.target.value) })}
                        />
                    </div>
                    <Button onClick={handleSave}>Salvar Configurações</Button>
                </CardContent>
            </Card>
        </div>
    );
}