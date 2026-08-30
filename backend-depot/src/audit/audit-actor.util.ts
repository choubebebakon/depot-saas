/**
 * Représente l'auteur d'une action, tel qu'extrait de la requête HTTP,
 * pour alimenter de façon cohérente les champs acteur/IP/user-agent
 * du Journal Audit (voir AuditService.logEvent).
 *
 * Un seul point de construction évite que chaque controller réinvente
 * sa propre lecture de req.user (source de bugs : `req.user.id` n'existe
 * pas, JwtStrategy attache `userId`).
 */
export interface AuditActor {
  userId: string | null;
  email: string | null;
  role: string | null;
  depotId: string | null;
  ip: string | null;
  userAgent: string | null;
}

export function buildAuditActor(req: any): AuditActor {
  return {
    userId: req?.user?.userId ?? null,
    email: req?.user?.email ?? null,
    role: req?.user?.role ?? null,
    depotId: req?.user?.depotId ?? null,
    ip: req?.ip ?? req?.socket?.remoteAddress ?? null,
    userAgent: req?.headers?.['user-agent'] ?? null,
  };
}