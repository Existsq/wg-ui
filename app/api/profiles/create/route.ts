import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { getServerIP } from '@/lib/server-ip';
import { isValidProfileName } from '@/lib/validate-name';
import { WG_INTERFACE, WG_PORT, WG_CLIENT_SUBNET, WG_DNS } from '@/lib/wg-env';

const execAsync = promisify(exec);

async function getServerPublicKey() {
  const publicKeyPath = path.join(os.homedir(), '/../etc/wireguard/publickey');
  try {
    return (await fs.readFile(publicKeyPath, 'utf-8')).trim();
  } catch {
    throw new Error('Не удалось прочитать публичный ключ сервера');
  }
}

async function generateKeys() {
  const { stdout: privateKey } = await execAsync('wg genkey');
  const { stdout: publicKey } = await execAsync(`echo "${privateKey.trim()}" | wg pubkey`);
  return { privateKey: privateKey.trim(), publicKey: publicKey.trim() };
}

async function findNextAvailableIP() {
  const basePath = path.join(os.homedir(), '/../etc/wireguard/client');
  const subnetPattern = WG_CLIENT_SUBNET.replace(/\./g, '\\.');
  const usedIPs = new Set<number>();

  const directories = await fs.readdir(basePath);
  for (const dir of directories) {
    const configPath = path.join(basePath, dir, `${dir}.conf`);
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const match = content.match(new RegExp(`Address\\s*=\\s*${subnetPattern}\\.(\\d+)`));
      if (match) usedIPs.add(parseInt(match[1]));
    } catch {
      continue;
    }
  }

  for (let i = 2; i <= 255; i++) {
    if (!usedIPs.has(i)) return `${WG_CLIENT_SUBNET}.${i}`;
  }
  throw new Error('Нет свободных IP адресов');
}

export async function POST(request: Request) {
  try {
    const { profileName } = await request.json();

    if (!profileName || !isValidProfileName(profileName)) {
      return NextResponse.json(
        { error: 'Имя профиля не указано или содержит недопустимые символы' },
        { status: 400 }
      );
    }

    const dirPath = path.join(os.homedir(), '/../etc/wireguard/client', profileName);
    const configPath = path.join(dirPath, `${profileName}.conf`);
    const publicKeyPath = path.join(dirPath, 'publickey');

    try {
      await fs.access(dirPath);
      return NextResponse.json({ error: 'Профиль с таким именем уже существует' }, { status: 409 });
    } catch {
      // нормально — директория не существует
    }

    const serverPublicKey = await getServerPublicKey();
    const { privateKey, publicKey } = await generateKeys();
    const ip = await findNextAvailableIP();
    const ipWithoutMask = ip.split('/')[0];
    const serverIP = await getServerIP();

    const config = `[Interface]
PrivateKey = ${privateKey}
Address = ${ip}/24
DNS = ${WG_DNS}

[Peer]
PublicKey = ${serverPublicKey}
AllowedIPs = 0.0.0.0/0
Endpoint = ${serverIP}:${WG_PORT}
PersistentKeepalive = 25
`;

    await execAsync(`sudo mkdir -p "${dirPath}"`);
    await execAsync(`sudo bash -c 'echo "${config}" > "${configPath}"'`);
    await execAsync(`sudo bash -c 'echo "${publicKey}" > "${publicKeyPath}"'`);
    await execAsync(`sudo wg set ${WG_INTERFACE} peer "${publicKey}" persistent-keepalive 25 allowed-ips "${ipWithoutMask}"`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка при создании профиля:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка при создании профиля' },
      { status: 500 }
    );
  }
}
