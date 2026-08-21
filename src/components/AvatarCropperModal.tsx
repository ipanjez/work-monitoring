'use client';

import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { X, Check, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface AvatarCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImageBase64: string) => void;
  onDelete?: () => void;
  currentImage?: string | null;
  title?: string;
}

const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (error) => reject(error));
    img.src = imageSrc;
  });

  const TARGET_SIZE = 150;
  const canvas = document.createElement('canvas');
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Draw image on canvas, scaling it to TARGET_SIZE
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    TARGET_SIZE,
    TARGET_SIZE
  );

  // Return Base64
  return canvas.toDataURL('image/jpeg', 0.8); // Compress slightly
};

export default function AvatarCropperModal({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  currentImage, 
  title = "Sesuaikan Foto Profil" 
}: AvatarCropperModalProps) {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Basic validation
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran maksimal gambar adalah 5MB');
        return;
      }

      const reader = new FileReader();
      reader.addEventListener('load', () => setImage(reader.result as string));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (image && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels);
        onSave(croppedImage);
        onClose();
        setImage(null);
      } catch (e) {
        toast.error('Gagal memproses gambar');
        console.error(e);
      }
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
      setImage(null);
    }
  };

  const handleClose = () => {
    onClose();
    setImage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 10500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="modal-content" style={{ maxWidth: '420px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--modal-bg, var(--surface-color))', border: '1px solid var(--border-color)', borderRadius: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{title}</h2>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {!image ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Current Image Preview if exists */}
            {currentImage && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '16px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Foto Saat Ini:</span>
                <img 
                  src={currentImage} 
                  alt="Foto Saat Ini" 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }} 
                />
                {onDelete && (
                  <button 
                    type="button" 
                    onClick={handleDelete}
                    className="btn btn-danger"
                    style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}
                  >
                    <Trash2 size={14} /> Hapus Foto Profil
                  </button>
                )}
              </div>
            )}

            <div style={{ padding: '30px 20px', border: '2px dashed var(--border-color)', borderRadius: '12px', textAlign: 'center', background: 'var(--surface-color)' }}>
              <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Upload size={16} /> {currentImage ? 'Ganti Foto Baru' : 'Pilih Gambar'}
                </span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Maks 5MB (JPG / PNG)</span>
              </label>
            </div>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative', width: '100%', height: '300px', background: '#222', borderRadius: '12px', overflow: 'hidden' }}>
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Zoom</span>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ flex: 1 }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setImage(null)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={16} /> Simpan Foto
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
