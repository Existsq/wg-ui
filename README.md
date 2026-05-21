# WireGuard Panel

Web UI для управления WireGuard клиентскими профилями на VDS. Позволяет создавать, удалять, переименовывать профили, скачивать конфиги и показывать QR-коды для импорта в мобильные клиенты.

## Возможности

- Создание клиентских профилей — автоматически генерирует ключи и назначает IP
- Удаление и переименование профилей
- Скачивание `.conf` файла
- QR-код для импорта в WireGuard (Android/iOS)
- Экспорт всех профилей в JSON и импорт обратно
- Тёмная/светлая тема

## Требования

- Node.js 18+
- WireGuard (`wg`, `wg-quick`) установлен на сервере
- Интерфейс `wg0` запущен
- Структура файлов:

```
/etc/wireguard/
├── wg0.conf
├── publickey          # публичный ключ сервера
└── client/
    └── <name>/
        ├── <name>.conf
        └── publickey
```

- Пользователь, от которого запущен Node.js, должен иметь `sudo`-права на `wg` и операции с файлами в `/etc/wireguard/`

## Установка

```bash
git clone <repo>
cd Wireguard-Pi-hole-UI
npm install
npm run build
npm start
```

По умолчанию сервер запускается на порту `3000`.

## Разработка

```bash
npm run dev
```

## Конфигурация

Параметры зашиты в коде и могут быть изменены при необходимости:

| Параметр | Файл | Значение по умолчанию |
|---|---|---|
| Подсеть клиентов | `api/profiles/create/route.ts` | `192.168.15.0/24` |
| DNS для клиентов | `api/profiles/create/route.ts` | `192.168.15.1` |
| Порт WireGuard | `api/profiles/create/route.ts` | `51194` |
| Путь к конфигам | все API роуты | `/etc/wireguard/client/` |

## Стек

- [Next.js 14](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [lucide-react](https://lucide.dev/) — иконки
- [qrcode](https://github.com/soldair/node-qrcode) — генерация QR-кодов
