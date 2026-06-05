import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const DataContext = createContext(null);

const initialState = {
  rayons: [],
  depots: [],
  metierActif: null,
  loading: { rayons: false, depots: false },
  error: { rayons: null, depots: null },
};

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_RAYONS_START':
      return { ...state, loading: { ...state.loading, rayons: true }, error: { ...state.error, rayons: null } };
    case 'FETCH_RAYONS_SUCCESS':
      return { ...state, rayons: action.payload, loading: { ...state.loading, rayons: false } };
    case 'FETCH_RAYONS_ERROR':
      return { ...state, error: { ...state.error, rayons: action.payload }, loading: { ...state.loading, rayons: false } };
    case 'FETCH_DEPOTS_START':
      return { ...state, loading: { ...state.loading, depots: true }, error: { ...state.error, depots: null } };
    case 'FETCH_DEPOTS_SUCCESS':
      return { ...state, depots: action.payload, loading: { ...state.loading, depots: false } };
    case 'FETCH_DEPOTS_ERROR':
      return { ...state, error: { ...state.error, depots: action.payload }, loading: { ...state.loading, depots: false } };
    case 'SET_METIER':
      return { ...state, metierActif: action.payload };
    default:
      return state;
  }
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { tenantId, isAuthenticated } = useAuth();

  const fetchRayons = useCallback(async (depotId) => {
    dispatch({ type: 'FETCH_RAYONS_START' });
    try {
      const res = await api.get('/rayons', { params: { tenantId, depotId } });
      dispatch({ type: 'FETCH_RAYONS_SUCCESS', payload: Array.isArray(res.data) ? res.data : [] });
    } catch (err) {
      dispatch({ type: 'FETCH_RAYONS_ERROR', payload: err.response?.data?.message || err.message });
    }
  }, [tenantId]);

  const fetchDepots = useCallback(async () => {
    dispatch({ type: 'FETCH_DEPOTS_START' });
    try {
      const res = await api.get('/depots', { params: { tenantId } });
      dispatch({ type: 'FETCH_DEPOTS_SUCCESS', payload: Array.isArray(res.data) ? res.data : [] });
    } catch (err) {
      dispatch({ type: 'FETCH_DEPOTS_ERROR', payload: err.response?.data?.message || err.message });
    }
  }, [tenantId]);

  const setMetier = useCallback((metier) => {
    localStorage.setItem('gestock_metier', metier);
    dispatch({ type: 'SET_METIER', payload: metier });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('gestock_metier');
    if (stored) {
      dispatch({ type: 'SET_METIER', payload: stored });
    }
  }, []);

  return (
    <DataContext.Provider value={{
      ...state,
      fetchRayons,
      fetchDepots,
      setMetier,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useDataContext doit être utilisé dans DataProvider');
  return ctx;
}

export default DataContext;
