import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const CHANNELS = [
  { key: 'inAppEnabled', label: 'In-App', desc: 'Notifications dans l\'application' },
  { key: 'emailEnabled', label: 'Email', desc: 'Notifications par email' },
  { key: 'whatsappEnabled', label: 'WhatsApp', desc: 'Notifications WhatsApp Business' },
  { key: 'pushEnabled', label: 'Push', desc: 'Notifications push mobile' },
  { key: 'smsEnabled', label: 'SMS', desc: 'Notifications par SMS' },
];

const CATEGORIES = [
  'STOCK', 'PAYMENT', 'SUBSCRIPTION', 'RESERVATION', 'ORDER',
  'DELIVERY', 'SECURITY', 'APPOINTMENT', 'MAINTENANCE', 'SYSTEM', 'METIER', 'IA',
];

export default function NotificationPreferencesPanel() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['notif-prefs', tenantId],
    queryFn: async () => {
      const res = await api.get('/notifications/preferences');
      return res.data;
    },
    enabled: !!tenantId,
  });

  const [form, setForm] = useState({
    inAppEnabled: true, emailEnabled: true, whatsappEnabled: false,
    pushEnabled: false, smsEnabled: false,
    silenceStart: '22:00', silenceEnd: '07:00',
    disabledCategories: [],
    dailyDigest: false, digestHour: 8,
  });

  useEffect(() => {
    if (prefs) {
      setForm({
        inAppEnabled: prefs.inAppEnabled ?? true,
        emailEnabled: prefs.emailEnabled ?? true,
        whatsappEnabled: prefs.whatsappEnabled ?? false,
        pushEnabled: prefs.pushEnabled ?? false,
        smsEnabled: prefs.smsEnabled ?? false,
        silenceStart: prefs.silenceStart || '22:00',
        silenceEnd: prefs.silenceEnd || '07:00',
        disabledCategories: prefs.disabledCategories ? JSON.parse(prefs.disabledCategories) : [],
        dailyDigest: prefs.dailyDigest ?? false,
        digestHour: prefs.digestHour ?? 8,
      });
    }
  }, [prefs]);

  const saveMutation = useMutation({
    mutationFn: async (data) => api.patch('/notifications/preferences', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-prefs', tenantId] });
    },
  });

  const toggle = (key) => {
    setForm((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCategory = (cat) => {
    setForm((prev) => ({
      ...prev,
      disabledCategories: prev.disabledCategories.includes(cat)
        ? prev.disabledCategories.filter((c) => c !== cat)
        : [...prev.disabledCategories, cat],
    }));
  };

  const handleSave = () => {
    saveMutation.mutate({
      ...form,
      disabledCategories: form.disabledCategories,
    });
  };

  if (isLoading) {
    return <div style={{ color: '#64748b', padding: '20px' }}>Chargement...</div>;
  }

  const isDirty = prefs && (
    form.inAppEnabled !== prefs.inAppEnabled ||
    form.emailEnabled !== prefs.emailEnabled ||
    form.whatsappEnabled !== prefs.whatsappEnabled ||
    form.pushEnabled !== prefs.pushEnabled ||
    form.smsEnabled !== prefs.smsEnabled ||
    form.silenceStart !== prefs.silenceStart ||
    form.silenceEnd !== prefs.silenceEnd ||
    form.dailyDigest !== prefs.dailyDigest ||
    form.digestHour !== prefs.digestHour
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>Canaux de notification</h2>
      <div style={styles.channelGrid}>
        {CHANNELS.map((ch) => (
          <label key={ch.key} style={styles.channelCard}>
            <div style={styles.channelInfo}>
              <span style={styles.channelLabel}>{ch.label}</span>
              <span style={styles.channelDesc}>{ch.desc}</span>
            </div>
            <button
              onClick={() => toggle(ch.key)}
              style={{
                ...styles.toggle,
                background: form[ch.key] ? '#2563eb' : '#1e293b',
              }}
            >
              <div style={{
                ...styles.toggleDot,
                transform: form[ch.key] ? 'translateX(20px)' : 'translateX(2px)',
              }} />
            </button>
          </label>
        ))}
      </div>

      <h2 style={{ ...styles.sectionTitle, marginTop: '32px' }}>Heures de silence</h2>
      <div style={styles.silenceRow}>
        <div style={styles.timeField}>
          <label style={styles.fieldLabel}>Début</label>
          <input
            type="time"
            value={form.silenceStart}
            onChange={(e) => setForm((p) => ({ ...p, silenceStart: e.target.value }))}
            style={styles.timeInput}
          />
        </div>
        <span style={{ color: '#64748b', marginTop: '24px' }}>→</span>
        <div style={styles.timeField}>
          <label style={styles.fieldLabel}>Fin</label>
          <input
            type="time"
            value={form.silenceEnd}
            onChange={(e) => setForm((p) => ({ ...p, silenceEnd: e.target.value }))}
            style={styles.timeInput}
          />
        </div>
      </div>

      <h2 style={{ ...styles.sectionTitle, marginTop: '32px' }}>Catégories désactivées</h2>
      <div style={styles.catGrid}>
        {CATEGORIES.map((cat) => (
          <label key={cat} style={styles.catItem}>
            <input
              type="checkbox"
              checked={!form.disabledCategories.includes(cat)}
              onChange={() => toggleCategory(cat)}
              style={styles.checkbox}
            />
            <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{cat}</span>
          </label>
        ))}
      </div>

      <h2 style={{ ...styles.sectionTitle, marginTop: '32px' }}>Résumé journalier</h2>
      <div style={styles.digestRow}>
        <label style={styles.channelCard}>
          <div style={styles.channelInfo}>
            <span style={styles.channelLabel}>Activer le résumé</span>
            <span style={styles.channelDesc}>Recevez un récapitulatif quotidien</span>
          </div>
          <button
            onClick={() => toggle('dailyDigest')}
            style={{
              ...styles.toggle,
              background: form.dailyDigest ? '#2563eb' : '#1e293b',
            }}
          >
            <div style={{
              ...styles.toggleDot,
              transform: form.dailyDigest ? 'translateX(20px)' : 'translateX(2px)',
            }} />
          </button>
        </label>
        {form.dailyDigest && (
          <div style={styles.digestHourField}>
            <label style={styles.fieldLabel}>Heure d'envoi</label>
            <select
              value={form.digestHour}
              onChange={(e) => setForm((p) => ({ ...p, digestHour: Number(e.target.value) }))}
              style={styles.select}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={!isDirty || saveMutation.isPending}
        style={{
          ...styles.saveBtn,
          opacity: !isDirty || saveMutation.isPending ? 0.5 : 1,
        }}
      >
        {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer les préférences'}
      </button>
      {saveMutation.isSuccess && (
        <p style={{ color: '#16a34a', fontSize: '13px', marginTop: '8px' }}>
          ✅ Préférences enregistrées
        </p>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '600px' },
  sectionTitle: { color: '#f1f5f9', fontSize: '16px', fontWeight: 700, margin: '0 0 12px' },
  channelGrid: { display: 'flex', flexDirection: 'column', gap: '6px' },
  channelCard: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', background: '#0f172a', borderRadius: '10px',
    cursor: 'pointer',
  },
  channelInfo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  channelLabel: { color: '#e2e8f0', fontSize: '14px', fontWeight: 600 },
  channelDesc: { color: '#64748b', fontSize: '12px' },
  toggle: {
    width: '42px', height: '24px', borderRadius: '12px', border: 'none',
    cursor: 'pointer', padding: '0', position: 'relative', flexShrink: 0,
    transition: 'background 0.2s',
  },
  toggleDot: {
    width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
    position: 'absolute', top: '2px', transition: 'transform 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  silenceRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  timeField: { display: 'flex', flexDirection: 'column', gap: '4px' },
  fieldLabel: { color: '#94a3b8', fontSize: '12px', fontWeight: 600 },
  timeInput: {
    background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px',
    padding: '8px 12px', color: '#e2e8f0', fontSize: '14px', fontFamily: 'inherit',
    outline: 'none',
  },
  catGrid: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  catItem: {
    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
    padding: '6px 12px', background: '#0f172a', borderRadius: '8px',
  },
  checkbox: { accentColor: '#2563eb', width: '16px', height: '16px', cursor: 'pointer' },
  digestRow: { display: 'flex', flexDirection: 'column', gap: '12px' },
  digestHourField: { display: 'flex', flexDirection: 'column', gap: '4px' },
  select: {
    background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px',
    padding: '8px 12px', color: '#e2e8f0', fontSize: '14px', fontFamily: 'inherit',
    outline: 'none', maxWidth: '120px',
  },
  saveBtn: {
    marginTop: '24px', background: '#2563eb', border: 'none', color: '#fff',
    padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
};
