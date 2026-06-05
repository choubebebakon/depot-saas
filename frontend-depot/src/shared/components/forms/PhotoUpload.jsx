import { useState, useRef, useCallback } from 'react';

export default function PhotoUpload({ label, name, value, onChange, maxSizeMB = 5, accept = 'image/*', error, disabled }) {
  const [preview, setPreview] = useState(value || null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const maxBytes = maxSizeMB * 1024 * 1024;

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (file.size > maxBytes) {
      alert(`L'image ne doit pas dépasser ${maxSizeMB} Mo`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      if (onChange) onChange({ target: { name, value: e.target.result } });
    };
    reader.readAsDataURL(file);
  }, [maxBytes, maxSizeMB, name, onChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (onChange) onChange({ target: { name, value: null } });
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      {label && (
        <label className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1.5 block">
          {label}
        </label>
      )}
      {preview ? (
        <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-700 group">
          <img src={preview} alt="Prévisualisation" className="w-full h-full object-cover" />
          <button type="button" onClick={handleRemove} disabled={disabled}
            className="absolute top-1 right-1 w-7 h-7 bg-red-600/80 hover:bg-red-600 text-white rounded-lg flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            ✕
          </button>
        </div>
      ) : (
        <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
          onClick={() => fileRef.current?.click()}
          className={`relative w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${dragging ? 'border-amber-500 bg-amber-500/10' : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'}`}>
          <span className="text-3xl mb-1">📷</span>
          <p className="text-slate-400 text-xs">Cliquez ou glissez une image</p>
          <p className="text-slate-600 text-xs mt-0.5">Max {maxSizeMB} Mo</p>
          <input ref={fileRef} type="file" accept={accept} onChange={handleInputChange}
            className="hidden" disabled={disabled} />
        </div>
      )}
      {error && <p className="text-red-400 text-xs mt-1">⚠️ {error}</p>}
    </div>
  );
}
