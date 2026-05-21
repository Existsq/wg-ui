export const WG_INTERFACE = process.env.WG_INTERFACE ?? 'wg0';
export const WG_PORT = process.env.WG_PORT ?? '51820';
export const WG_CLIENT_SUBNET = process.env.WG_CLIENT_SUBNET ?? '10.0.0';
export const WG_DNS = process.env.WG_DNS ?? `${process.env.WG_CLIENT_SUBNET ?? '10.0.0'}.1`;
