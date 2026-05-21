"use client"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QrCodeIcon, Download, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Image from 'next/image';
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


export type ServerSummaryType = {
  label?: string;
  value?: string;
  className?: string;
};

export function ServerCardSummary(props: ServerSummaryType) {
  return (
    <div
      className={cn(
        "w-full bg-background border-border border-[1px] rounded-sm z-30 flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left sm:px-8 sm:py-6",
        props.className
      )}
    >
      <span className="text-xs text-muted-foreground">{props.label}</span>
      <span className="text-lg font-bold leading-none sm:text-2xl">
        {props.value}
      </span>
    </div>
  );
}

export type ServerSummarySkeletonType = {
  className?: string;
};

export function ServerCardSummarySkeleton(props: ServerSummarySkeletonType) {
  return (
    <div
      className={cn(
        "w-full bg-background border-border border-[1px] rounded-sm z-30 flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left sm:px-8 sm:py-6 space-y-2",
        props.className
      )}
    >
      <div className="animate-pulse bg-muted w-2/3 rounded-sm h-4"></div>
      <div className="animate-pulse bg-muted w-full rounded-sm h-4"></div>
    </div>
  );
}

interface ServerCardProps {
  name: string;
  address: string;
  dns: string;
  onUpdate: () => void;
}

export function ServerCard(props: ServerCardProps) {
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string>('');
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [serverName, setServerName] = useState(props.name);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!isRenameDialogOpen) {
      setNewName('');
    }
  }, [isRenameDialogOpen]);

  const handleShowQrCode = async () => {
    try {
      const response = await fetch(`/api/qrcode/${props.name}`);
      
      if (!response.ok) {
        throw new Error('Ошибка при генерации QR-кода');
      }

      const data = await response.json();
      setQrCode(data.qrCode);
      setIsQrDialogOpen(true);
      props.onUpdate();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось сгенерировать QR-код"
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/delete/${props.name}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Ошибка при удалении');
      }

      toast({
        title: "Успешно",
        description: "Конфигурация успешно удалена"
      });

      props.onUpdate();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить конфигурацию"
      });
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/download/${props.name}/${props.name}.conf`);
      
      if (!response.ok) {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: data.error || 'Ошибка при скачивании конфигурации'
        });
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${props.name}.conf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Успешно",
        description: "Конфигурация успешно скачана"
      });

      props.onUpdate();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Ошибка при скачивании конфигурации"
      });
    }
  };

  const handleRename = async () => {
    if (!newName.trim()) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Название не может быть пустым"
      });
      return;
    }

    try {
      const response = await fetch(`/api/rename/${serverName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName: newName.trim() }),
        cache: 'no-store',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при переименовании');
      }

      toast({
        title: "Успешно",
        description: "Конфигурация переименована"
      });

      setServerName(newName.trim());
      setIsRenameDialogOpen(false);
      props.onUpdate();

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось переименовать конфигурацию"
      });
    }
  };

  return (
    <>
      <Card className="transform transition-transform duration-300 ease-in-out hover:scale-[1.01]">
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex items-center">
            <CardTitle>{props.name}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 grid-rows-1 gap-4 pb-4 text-lg md:grid-cols-1">
          <ServerCardSummary value={props.address} label="IP address" />
          <ServerCardSummary value={props.dns} label="DNS" />
        </CardContent>

        <CardFooter className="items-center justify-between gap-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1">
          <div className="flex items-center gap-2 w-full justify-between">
            <Button variant="secondary" onClick={handleShowQrCode} className="w-full">
              <QrCodeIcon size={22} />
            </Button>
          <Button 
            variant="secondary"
            onClick={handleDownload}
            className="w-full"
          >
            <Download size={22} />
            
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="w-full"
          >
            <Trash2 size={22} />
          </Button>
          </div>
          <div className="md:grid-cols-1">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setIsRenameDialogOpen(true)}
          >
            Переименовать
          </Button>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[400px] p-6 rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Конфигурация будет удалена безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <AlertDialogContent className="max-w-[400px] p-6 rounded-lg">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-2xl font-bold">
              Переименовать профиль
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Введите новое название для профиля {serverName}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Новое название"
              className="w-full"
              autoFocus
            />
          </div>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              className="mt-0 flex-1"
              onClick={() => setIsRenameDialogOpen(false)}
            >
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction 
              className="mt-0 flex-1"
              onClick={handleRename}
            >
              Переименовать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="max-w-[400px] md:max-w-[600px] md:py-10 mx-auto rounded-lg">
          <div className="flex flex-col items-center space-y-4 px-6">
            <h2 className="text-2xl font-bold">{props.name}</h2>
            <p className="text-muted-foreground text-sm text-center">
              Отсканируйте QR-код для импорта конфигурации
            </p>
            <div className="bg-white rounded-lg">
              {qrCode && (
                <Image
                  src={qrCode}
                  alt="Configuration QR Code"
                  width={250}
                  height={250}
                  className="rounded-lg"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ServerCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex gap-4 items-center">
          <Avatar>
            <AvatarImage alt="server avatar" />
            <AvatarFallback></AvatarFallback>
          </Avatar>
          <CardTitle>
            <div className="animate-pulse bg-muted w-48 rounded-lg h-6"></div>
          </CardTitle>
        </div>
        <div
          id="dropdown"
          className="h-8 w-8 bg-muted animate-pulse rounded-sm"
        ></div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 grid-rows-2 gap-4 pb-10">
        <ServerCardSummarySkeleton className="h-[102px]" />
        <ServerCardSummarySkeleton className="h-[102px]" />
        <ServerCardSummarySkeleton className="h-[102px]" />
        <ServerCardSummarySkeleton className="h-[102px]" />
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-4">
        <Button variant="skeleton" className="w-full"></Button>
        <Button variant="skeleton" className="w-full"></Button>
      </CardFooter>
    </Card>
  );
}
