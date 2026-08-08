'use client';

import { useState, useRef } from 'react';
import {
  LOGO_MAX_SIZE_BYTES,
  LOGO_ACCEPTED_TYPES,
  LOGO_ACCEPT_ATTR,
} from '@/lib/bracelets';

interface LogoUploadProps {
  /** Callback appelé à chaque changement de logo (file + data URL preview). */
  onLogoSelect: (file: File | null, preview: string | null) => void;
}

/**
 * Upload de logo avec preview instantanée et validation côté client.
 *
 * Validation :
 *   - Type : SVG / PNG / JPG / WEBP
 *   - Taille max : 5 MB
 *
 * Note : la validation côté serveur (server action) refait ces checks
 * et ne fait jamais confiance aux données client.
 */
export default function LogoUpload({ onLogoSelect }: LogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview(null);
    setError(null);
    setFileName(null);
    onLogoSelect(null, null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);

    if (!file) {
      reset();
      return;
    }

    // ─── Validation type ───
    if (!LOGO_ACCEPTED_TYPES.includes(file.type as (typeof LOGO_ACCEPTED_TYPES)[number])) {
      setError('Format non supporté. Utilisez SVG, PNG, JPG ou WEBP.');
      reset();
      return;
    }

    // ─── Validation taille ───
    if (file.size > LOGO_MAX_SIZE_BYTES) {
      setError(`Image trop volumineuse (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`);
      reset();
      return;
    }

    // ─── Preview via FileReader (data URL) ───
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      setFileName(file.name);
      onLogoSelect(file, result);
    };
    reader.onerror = () => {
      setError('Erreur lors de la lecture du fichier. Réessayez.');
      reset();
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-bold text-white">
        Logo de votre hôtel <span className="text-[#E3B23C]">*</span>
      </label>

      <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-[#E3B23C] transition-colors bg-black/50">
        {preview ? (
          <div className="space-y-3">
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Aperçu du logo"
                className="max-h-32 mx-auto rounded-lg border-2 border-[#E3B23C]/30"
              />
              <button
                type="button"
                onClick={reset}
                aria-label="Supprimer le logo"
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              >
                ✕
              </button>
            </div>
            {fileName && (
              <p className="text-xs text-gray-400 truncate max-w-xs mx-auto">{fileName}</p>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-[#E3B23C] underline hover:text-yellow-400"
            >
              Changer de fichier
            </button>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-2">🖼️</div>
            <p className="font-medium text-white">Cliquez pour uploader votre logo</p>
            <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG, WEBP (max 5MB)</p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={LOGO_ACCEPT_ATTR}
          onChange={handleFileChange}
          className="hidden"
          id="logo-upload"
        />
        {!preview && (
          <label
            htmlFor="logo-upload"
            className="inline-block mt-3 px-4 py-2 bg-[#E3B23C] text-black font-bold rounded-lg cursor-pointer hover:bg-yellow-500 transition"
          >
            Choisir un fichier
          </label>
        )}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="text-xs text-gray-400 space-y-1">
        <p>✓ Format vectoriel (SVG) recommandé pour une impression nette</p>
        <p>✓ Résolution min : 500×500 px</p>
        <p>✓ Fond transparent préféré</p>
      </div>
    </div>
  );
}
