'use client';

import { Suspense, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Car, Shield, Upload, CheckCircle, Zap } from 'lucide-react';
import { api } from '@/lib/api';
import { saveAuth } from '@/lib/auth';

function VerifyResidencyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || '';

  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  async function handleSubmit() {
    if (!file) {
      setError('Please select a document to upload.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('verificationDocument', file);
      formData.append('state', 'CA');
      formData.append('city', 'San Francisco');
      formData.append('apartment', 'The Skyline Residents');
      const result = await api.submitVerification(userId, formData);
      // Backend returns a fresh token with isVerified:true — save it so the
      // middleware cookie is updated before we navigate to /browse.
      saveAuth(result.token, result.userId);
      router.push('/browse');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <Car className="w-6 h-6" />
            GarKar
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/my-bookings">My Bookings</Link>
            <Link href="/vehicles">Vehicles</Link>
            <Link href="/support">Support</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Verification Pending</span>
            <span className="text-sm font-semibold text-blue-600">66%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '66%' }} />
          </div>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Step 2 of 3: Residency Check</p>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Verify Your Residency</h1>
        <p className="text-center text-gray-500 mb-8">
          To ensure the safety of our car-sharing community, please confirm you live at{' '}
          <span className="font-semibold text-gray-800">The Skyline Residents</span>.
        </p>

        {/* Trust notice */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex items-start gap-3 mb-8">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <strong>Trust &amp; Privacy</strong> — Your documents are encrypted using AES-256 and are only used for
              building verification. Data is deleted automatically after processing.
            </p>
          </div>
          <Link href="/security" className="text-sm text-blue-600 font-medium whitespace-nowrap hover:underline">
            View Security Protocol →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option 1 — Upload document */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              {file && <CheckCircle className="w-5 h-5 text-green-500" />}
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Lease/Utility Upload</h3>
            <p className="text-sm text-gray-500 mb-4">
              Upload a PDF or JPG of your current lease agreement or utility bill from the last 60 days.
            </p>

            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              {file ? (
                <p className="text-sm font-medium text-blue-600">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, or PNG (max. 10MB)</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            {file && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="mt-4 w-full bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {loading ? 'Uploading…' : 'Select Files'}
              </button>
            )}
          </div>

          {/* Option 2 — Resident portal */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Digital Resident Key</h3>
            <p className="text-sm text-gray-500 mb-4">
              Verify instantly by signing into your building&apos;s resident portal. Supports Yardi, Entrata, and AppFolio.
            </p>

            <button className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4">
              <span>→</span> Connect Resident Portal
            </button>

            <div className="bg-gray-100 rounded-xl h-36 flex items-center justify-center text-gray-400 text-sm">
              Portal preview
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-medium">
              <Zap className="w-3.5 h-3.5" />
              Recommended: Verification is typically instant with this method.
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            I&apos;ll do this later
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !file}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting…' : 'Submit for Review'}
            </button>
          </div>
        </div>

        <p className="text-xs text-center text-gray-400 mt-6">
          © 2024 GarKar Technologies Inc. All documents are handled according to our{' '}
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

export default function VerifyResidencyPage() {
  return (
    <Suspense>
      <VerifyResidencyContent />
    </Suspense>
  );
}
