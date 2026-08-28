import { useState, useRef, useCallback, useEffect } from 'react';
import api from '../../../api/axios';
import { resolveMediaUrl } from '../../../utils/media';

export default function PhotoUpload({ label, name, value, onChange, maxSizeMB = 5, accept = 'image/jpeg,image/png,image/webp', error, disabled }) {
  const [preview, setPreview] = useState(resolveMediaUrl(value));
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setPreview(resolveMediaUrl(value));
  }, [value]);

  const maxBytes = maxSizeMB * 1024 * 1024;

  const handleFile = useCallback(async (file) => {
    if (!file || disabled) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Format image non supporté. Utilisez JPG, PNG ou WEBP.');
      return;
    }
    if (file.size > maxBytes) {
      alert(`L'image ne doit pas dépasser ${maxSizeMB} Mo`);
      return;
    }

    setUploading(true);
    try {
      const localPreview = URL.createObjectURL(file);
      setPreview(localPreview);

      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const url = response.data?.url;
      if (!url) throw new Error('Réponse upload invalide');

      URL.revokeObjectURL(localPreview);
      setPreview(resolveMediaUrl(url));
      onChange?.({ target: { name, value: url } });
    } catch (uploadError) {
      setPreview(resolveMediaUrl(value));
      alert(uploadError.response?.data?.message || 'Échec du téléchargement de la photo');
    } finally {
      setUploading(false);
    }
  }, [disabled, maxBytes, maxSizeMB, name, onChange, value]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);

  const handleInputChange = (e) => handleFile(e.target.files?.[0]);

  const handleRemove = () => {
    if (disabled || uploading) return;
    setPreview(null);
    onChange?.({ target: { name, value: null } });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      {label && <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">{label}</label>}
      {preview ? (
        <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-700 group">
          <img src={preview} alt="Prévisualisation" className="w-full h-full object-cover" />
          <button type="button" onClick={handleRemove} disabled={disabled || uploading}
            className="absolute top-1 right-1 w-7 h-7 bg-red-600/80 hover:bg-red-600 text-white rounded-lg flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            ✕
          </button>
          {uploading && <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center text-white text-xs font-bold">Upload...</div>}
        </div>
      ) : (
        <div onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onClick={() => !disabled && !uploading && fileRef.current?.click()}
          className={`relative w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${dragging ? 'border-amber-500 bg-amber-500/10' : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <span className="text-3xl mb-1">📷</span>
          <p className="text-slate-400 text-xs">Cliquez ou glissez une image</p>
          <p className="text-slate-600 text-xs mt-0.5">JPG, PNG, WEBP · Max {maxSizeMB} Mo</p>
          {uploading && <p className="text-amber-400 text-xs mt-1">Téléchargement...</p>}
          <input ref={fileRef} type="file" accept={accept} onChange={handleInputChange} className="hidden" disabled={disabled || uploading} />
        </div>
      )}
      {error && <p className="text-red-400 text-xs mt-1">⚠️ {error}</p>}
    </div>
  );
}
