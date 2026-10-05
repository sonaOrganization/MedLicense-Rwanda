export interface CurrentAccount {
  name: string | null; email: string; role: string; is_banned: boolean; license_category: string | null; language: string;
}
interface Lookup {
  user(id: string): Promise<{ data: CurrentAccount | null; error: unknown }>;
  session(id: string, device: string): Promise<{ data: { session_id: string } | null; error: unknown }>;
}
export async function validateSessionToken<T extends Record<string, unknown>>(token: T, lookup: Lookup): Promise<T | null> {
  if (typeof token.id !== "string" || typeof token.sessionId !== "string" || typeof token.deviceType !== "string") return null;
  try {
    const [user, session] = await Promise.all([lookup.user(token.id), lookup.session(token.id, token.deviceType)]);
    if (user.error || session.error || !user.data || user.data.is_banned || session.data?.session_id !== token.sessionId) return null;
    return { ...token, role: user.data.role, name: user.data.name, email: user.data.email, language: user.data.language, licenseCategory: user.data.license_category };
  } catch { return null; }
}
