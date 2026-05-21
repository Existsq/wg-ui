import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { isValidProfileName } from '@/lib/validate-name';

const execAsync = promisify(exec);

export async function PUT(
  request: Request,
  { params }: { params: { name: string } }
) {
  if (!isValidProfileName(params.name)) {
    return NextResponse.json({ error: 'Недопустимое имя профиля' }, { status: 400 });
  }

  try {
    const { newName } = await request.json();

    if (!isValidProfileName(newName)) {
      return NextResponse.json({ error: 'Недопустимое новое имя профиля' }, { status: 400 });
    }
    
    const oldDirPath = path.join(os.homedir(), '/../etc/wireguard/client', params.name);
    const oldConfigPath = path.join(oldDirPath, `${params.name}.conf`);
    const newDirPath = path.join(os.homedir(), '/../etc/wireguard/client', newName);
    const newConfigPath = path.join(newDirPath, `${newName}.conf`);
    
    // Проверяем существование старой конфигурации
    try {
      await fs.access(oldConfigPath);
    } catch {
      return NextResponse.json(
        { error: 'Конфигурация не найдена' },
        { status: 404 }
      );
    }

    // Проверяем, не существует ли уже конфигурация с новым именем
    try {
      await fs.access(newDirPath);
      return NextResponse.json(
        { error: 'Конфигурация с таким именем уже существует' },
        { status: 409 }
      );
    } catch {
      // Это нормально, если папка не существует
    }

    // Создаем новую директорию через sudo
    await execAsync(`sudo mkdir -p "${newDirPath}"`);

    // Копируем конфиг в новый файл через sudo
    await execAsync(`sudo cp "${oldConfigPath}" "${newConfigPath}"`);

    // Удаляем старый файл и директорию через sudo
    await execAsync(`sudo rm "${oldConfigPath}"`);
    await execAsync(`sudo rm -r "${oldDirPath}"`);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Ошибка при переименовании:', error);
    return NextResponse.json(
      { error: 'Ошибка при переименовании конфигурации' },
      { status: 500 }
    );
  }
}
