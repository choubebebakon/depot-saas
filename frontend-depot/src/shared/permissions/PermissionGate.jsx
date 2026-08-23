import AccesRestreint from './AccesRestreint';
import { usePermission } from '../hooks/usePermission';

/**
 * Enveloppe une page mÃ©tier : bloque l'affichage si canRead est false.
 * Les enfants peuvent utiliser usePermission pour canWrite.
 */
export default function PermissionGate({ sousModule, children }) {
  const { canRead, libelleRoleAutorise } = usePermission(sousModule);

  if (!canRead) {
    return (
      <AccesRestreint
        sousModule={sousModule}
        libelleRoleAutorise={libelleRoleAutorise}
      />
    );
  }

  return children;
}

