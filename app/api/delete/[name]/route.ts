import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { isValidProfileName } from '@/lib/validate-name';

const execAsync = promisify(exec);

export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  if (!isValidProfileName(params.name)) {
    return NextResponse.json({ error: 'Недопустимое имя профиля' }, { status: 400 });
  }

  try {
    const dirPath = path.join(os.homedir(), '/../etc/wireguard/client', params.name);
    const configPath = path.join(dirPath, `${params.name}.conf`);
    const publicKeyPath = path.join(dirPath, 'publickey');

    // Читаем публичный ключ
    const publicKey = await fs.readFile(publicKeyPath, 'utf-8').then(key => key.trim());

    // Удаляем файл конфигурации через sudo
    await execAsync(`sudo rm "${configPath}"`);
    // Удаляем директорию через sudo
    await execAsync(`sudo rm -r "${dirPath}"`);
    // Удаляем пир из WireGuard
    await execAsync(`sudo wg set wg0 peer "${publicKey}" remove`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при удалении конфигурации:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении конфигурации' },
      { status: 500 }
    );
  }
} 
