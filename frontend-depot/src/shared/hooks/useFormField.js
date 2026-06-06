import { useCallback } from 'react';

/**
 * Retourne un setter de champ pour les formulaires GeStock.
 * Compatible FormField (event) et DateTimePicker / Autocomplete (value directe).
 */
export function useFormField(setForm) {
  return useCallback(
    (field) => (valueOrEvent) => {
      const value =
        valueOrEvent?.target !== undefined ? valueOrEvent.target.value : valueOrEvent;
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [setForm],
  );
}

/** Alias non-hook pour les composants sans besoin de mémoïsation */
export function createFieldSetter(setForm) {
  return (field) => (valueOrEvent) => {
    const value =
      valueOrEvent?.target !== undefined ? valueOrEvent.target.value : valueOrEvent;
    setForm((prev) => ({ ...prev, [field]: value }));
  };
}

export default useFormField;
