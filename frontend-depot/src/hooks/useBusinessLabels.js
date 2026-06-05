import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getBusinessLabels } from '../config/business-labels';

export function useBusinessLabels() {
  const { metier } = useAuth();
  return useMemo(() => getBusinessLabels(metier), [metier]);
}
