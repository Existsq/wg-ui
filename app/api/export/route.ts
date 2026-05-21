import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { WG_INTERFACE } from "@/lib/wg-env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clientPath = path.join(os.homedir(), "/../etc/wireguard/client");
    const wg0ConfigPath = path.join(os.homedir(), `/../etc/wireguard/${WG_INTERFACE}.conf`);
    const wg0Config = await fs.readFile(wg0ConfigPath, "utf-8");
    const dirs = await fs.readdir(clientPath);

    const configs = await Promise.all(
      dirs.map(async (name) => {
        const configPath = path.join(clientPath, name, `${name}.conf`);
        const config = await fs.readFile(configPath, "utf-8");

        // Извлекаем нужные данные из конфига клиента
        const privateKey = config
          .match(/PrivateKey\s*=\s*([^\n]+)/)?.[1]
          .trim();
        const address =
          config.match(/Address\s*=\s*([^\n]+)/)?.[1].trim() || "";
        const dns = config.match(/DNS\s*=\s*([^\n]+)/)?.[1].trim();
        const keepAlive = config
          .match(/PersistentKeepalive\s*=\s*([^\n]+)/)?.[1]
          .trim();

        // Ищем публичный ключ в wg0.conf для пользователя с соответствующим Address
        const clientIP = address ? address.split("/")[0] : "";
        const peers = wg0Config.split("[Peer]").slice(1); // Получаем все секции [Peer]
        const peer = peers.find((p) => {
          const peerAddress = p.match(/Address\s*=\s*([^\n]+)/)?.[1].trim();
          return peerAddress === `${clientIP}/24`;
        });
        const publicKeyPath = path.join(clientPath, name, "publickey");
        const publicKey = await fs
          .readFile(publicKeyPath, "utf-8")
          .then((key) => key.trim());

        return {
          Name: name,
          PublicKey: publicKey || "",
          PrivateKey: privateKey || "",
          KeepAlive: keepAlive || "",
          Address: clientIP || "", // Теперь без маски
          DNS: dns || "",
        };
      })
    );

    const jsonString = JSON.stringify(configs, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="wg0.json"',
        "Content-Length": blob.size.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Ошибка при экспорте:", error);
    return NextResponse.json(
      { error: "Ошибка при экспорте конфигураций" },
      { status: 500 }
    );
  }
}
