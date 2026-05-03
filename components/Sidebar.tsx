"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, Users, Building, Settings as SettingsIcon, TableProperties } from "lucide-react";

const navItems = [
	{ href: "/subjects", label: "Matérias", icon: BookOpen },
	{ href: "/teachers", label: "Professores", icon: Users },
	{ href: "/classrooms", label: "Turmas", icon: Building },
	{ href: "/results", label: "Resultados", icon: TableProperties },
	{ href: "/settings", label: "Configurações", icon: SettingsIcon },
];

export function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="w-64 border-r bg-background flex flex-col md:flex">
			<div className="h-14 flex items-center border-b px-4">
				<span className="font-bold text-lg">Gerador de Horários</span>
			</div>
			<nav className="flex-1 overflow-y-auto py-4">
				<ul className="grid gap-1 px-2">
					{navItems.map((item) => {
						const Icon = item.icon;
						const isActive = pathname.startsWith(item.href);
						return (
							<li key={item.href}>
								<Link
									href={item.href}
									className={cn(
										"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
										isActive
											? "bg-primary text-primary-foreground"
											: "hover:bg-muted"
									)}
								>
									<Icon className="h-4 w-4" />
									{item.label}
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>
		</aside>
	);
}
