'use client';

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useConfigs } from "@/components/general/configs-context";

export default function DashboardHeader() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const { toast } = useToast();
  const { fetchConfigs } = useConfigs();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!newProfileName.trim()) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Название профиля не может быть пустым"
      });
      return;
    }

    try {
      const response = await fetch('/api/profiles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileName: newProfileName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при создании профиля');
      }

      toast({ title: "Успешно", description: "Профиль создан" });
      setIsCreateDialogOpen(false);
      setNewProfileName('');
      fetchConfigs();

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать профиль"
      });
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/export');
      if (!response.ok) throw new Error('Ошибка при экспорте');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'wg0.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: "Успешно", description: "Конфигурации экспортированы" });
    } catch {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось экспортировать конфигурации"
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/import', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Ошибка при импорте');

      toast({ title: "Успешно", description: "Конфигурации импортированы" });
      fetchConfigs();
    } catch {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось импортировать конфигурации"
      });
    }
  };

  return (
    <header className="sticky top-0 flex h-fit items-center border bg-background z-[100] mx-6 mt-6 rounded-md">
      <nav className="grid grid-cols-2 gap-2 text-lg font-medium p-4 w-full space-y-1">
        <Button
          className="w-full col-span-2"
          variant="default"
          onClick={() => setIsCreateDialogOpen(true)}
        >
          Create new
        </Button>
        <Button variant="secondary" className="w-full" onClick={handleExport}>
          Export profiles
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          Import profiles
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".json"
          onChange={handleImport}
        />
      </nav>

      <AlertDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <AlertDialogContent className="max-w-[400px] p-6 rounded-lg">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-2xl font-bold">
              Создать новый профиль
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Введите название для нового профиля
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="Название профиля"
              className="w-full"
              autoFocus
            />
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              className="mt-0 flex-1"
              onClick={() => { setNewProfileName(''); setIsCreateDialogOpen(false); }}
            >
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction className="mt-0 flex-1" onClick={handleCreate}>
              Создать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
