'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Upload, X, GripVertical, Camera, Sun, Maximize, AlignHorizontalJustifyCenter } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';

interface UploadedPhoto {
  id: string;
  name: string;
  previewUrl: string;    // local object URL or backend URL
  backendUrl: string;    // the real URL returned from backend (empty while uploading)
  isCover: boolean;
  uploading: boolean;
  error?: string;
}

const PHOTO_TIPS = [
  { icon: Sun, title: 'Daylight is best', desc: 'Shoot in natural light for vibrant, true-to-life colors.' },
  { icon: Camera, title: 'Capture all angles', desc: 'Front, rear, sides, interior — give renters the full picture.' },
  { icon: Maximize, title: 'Keep it clutter-free', desc: 'Remove personal items for a clean, professional look.' },
  { icon: AlignHorizontalJustifyCenter, title: 'Landscape orientation', desc: 'Horizontal photos display best in our listings.' },
];

const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001';

export default function ListPhotosPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  async function processFiles(files: File[]) {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    // Add placeholders immediately with local previews
    const placeholders: UploadedPhoto[] = imageFiles.map((f, i) => ({
      id: `${Date.now()}-${i}`,
      name: f.name,
      previewUrl: URL.createObjectURL(f),
      backendUrl: '',
      isCover: false,
      uploading: true,
    }));
    setPhotos((prev) => [...prev, ...placeholders]);

    // Upload all at once
    try {
      const { urls } = await api.uploadImages(imageFiles);
      setPhotos((prev) =>
        prev.map((p) => {
          const idx = placeholders.findIndex((pl) => pl.id === p.id);
          if (idx === -1) return p;
          return { ...p, backendUrl: `${BASE_URL}${urls[idx]}`, uploading: false };
        })
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setPhotos((prev) =>
        prev.map((p) =>
          placeholders.find((pl) => pl.id === p.id)
            ? { ...p, uploading: false, error: msg }
            : p
        )
      );
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) processFiles(Array.from(e.target.files));
    e.target.value = '';
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() { setIsDragOver(false); }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  }

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      // If we removed the cover, assign cover to first remaining
      if (updated.length > 0 && !updated.some((p) => p.isCover)) {
        updated[0].isCover = true;
      }
      return updated;
    });
  }

  function setCover(id: string) {
    setPhotos((prev) => prev.map((p) => ({ ...p, isCover: p.id === id })));
  }

  function handleContinue() {
    const uploadedUrls = photos
      .filter((p) => p.backendUrl)
      .map((p) => p.backendUrl);

    const saved = JSON.parse(localStorage.getItem('garkar_list_car') || '{}');
    localStorage.setItem('garkar_list_car', JSON.stringify({ ...saved, images: uploadedUrls }));
    router.push('/host/list/pricing');
  }

  const readyCount = photos.filter((p) => !p.uploading && !p.error).length;
  const uploadingCount = photos.filter((p) => p.uploading).length;

  return (
    <AppLayout>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/host/list" className="hover:text-gray-700">Host a Car</Link>
            <span>/</span>
            <Link href="/host/list" className="hover:text-gray-700">Car Details</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Photos</span>
          </nav>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Show off your car</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Listings with great photos get up to 3x more bookings. Add at least 4 high-quality images.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Step 2 of 4: Photos</span>
            <span className="text-sm text-gray-500">40%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '40%' }} />
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex-1 space-y-6">
            {/* Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Drag and drop your photos here
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                JPG or PNG · Max 10 MB per file
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload from computer
              </button>
            </div>

            {/* Photo Grid */}
            {photos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Photos ({readyCount} uploaded{uploadingCount > 0 ? `, ${uploadingCount} uploading` : ''})
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <GripVertical className="w-3.5 h-3.5" />
                    Click photo to set as cover
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div
                        className={`aspect-square rounded-xl overflow-hidden relative cursor-pointer border-2 transition-colors ${
                          photo.isCover ? 'border-blue-500' : 'border-transparent'
                        }`}
                        onClick={() => !photo.uploading && setCover(photo.id)}
                      >
                        {/* Preview image */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.previewUrl}
                          alt={photo.name}
                          className="w-full h-full object-cover"
                        />

                        {/* Cover badge */}
                        {photo.isCover && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                              COVER
                            </span>
                          </div>
                        )}

                        {/* Upload progress overlay */}
                        {photo.uploading && (
                          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center px-3">
                            <p className="text-white text-xs font-semibold mb-2">Uploading...</p>
                            <div className="w-full bg-white/30 rounded-full h-1.5">
                              <div className="bg-white h-1.5 rounded-full w-2/3 animate-pulse" />
                            </div>
                          </div>
                        )}

                        {/* Error overlay */}
                        {photo.error && (
                          <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center px-2">
                            <p className="text-white text-xs font-semibold text-center">{photo.error}</p>
                          </div>
                        )}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>

                      <p className="text-xs text-gray-500 mt-1 truncate">{photo.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <Link
                href="/host/list"
                className="px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </Link>
              <button
                onClick={handleContinue}
                disabled={uploadingCount > 0}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {uploadingCount > 0 ? 'Uploading...' : 'Save and Continue'}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-72 flex-shrink-0 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Photography Tips</h3>
              <ul className="space-y-4">
                {PHOTO_TIPS.map(({ icon: Icon, title, desc }) => (
                  <li key={title} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-600 rounded-2xl p-6 text-white">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mb-3">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-base mb-1">Need a Pro?</h3>
              <p className="text-blue-200 text-xs mb-4">
                Our professional photographers can capture your car in the best light.
              </p>
              <Link
                href="/pro-photography"
                className="inline-block text-xs font-bold tracking-widest uppercase bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                CHECK ELIGIBILITY
              </Link>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
