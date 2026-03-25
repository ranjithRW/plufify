import { useEffect, useMemo, useState } from 'react';

type PlushifyResponse = {
  b64_json: string;
  mimeType?: string;
};

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('plushie.png');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptLabel = useMemo(() => 'image/*', []);

  useEffect(() => {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  async function onConvert() {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResultUrl(null);

    try {
      const form = new FormData();
      form.append('image', file);

      const res = await fetch('/api/plushify', {
        method: 'POST',
        body: form,
      });

      const json = (await res.json().catch(() => null)) as PlushifyResponse & {
        error?: string;
      } | null;

      if (!res.ok) {
        throw new Error(json?.error || `Request failed (${res.status})`);
      }
      if (!json?.b64_json) {
        throw new Error('No image returned from server.');
      }

      const mimeType = json.mimeType || file.type || 'image/png';
      setResultUrl(`data:${mimeType};base64,${json.b64_json}`);
      const base = (file.name || 'upload').replace(/\.[^.]+$/, '');
      setDownloadName(`${base}-plushie.png`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center p-6">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Plushie Creator</h1>
              <p className="mt-1 text-sm text-slate-600">
                Upload a photo and get a cozy, adorable plushie-style result.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 self-start rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 sm:self-auto">
              <span className="text-slate-600">Image</span>
              <input
                className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border file:border-slate-200 file:bg-white file:px-3 file:py-1.5 file:font-semibold file:text-slate-900 hover:file:bg-slate-50"
                type="file"
                accept={acceptLabel}
                onChange={(e) => {
                  const next = e.target.files?.[0] || null;
                  setFile(next);
                  setResultUrl(null);
                  setError(null);
                }}
              />
            </label>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Original
              </div>
              {previewUrl ? (
                <img
                  className="h-[320px] w-full rounded-xl bg-white object-contain ring-1 ring-slate-200 md:h-[420px]"
                  src={previewUrl}
                  alt="Original upload preview"
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-300/60 bg-slate-50 px-4 text-center text-sm text-slate-600 md:h-[420px]">
                  Choose an image to preview.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Plushie
              </div>
              {resultUrl ? (
                <img
                  className="h-[320px] w-full rounded-xl bg-white object-contain ring-1 ring-slate-200 md:h-[420px]"
                  src={resultUrl}
                  alt="Plushie result"
                />
              ) : (
                <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-300/60 bg-slate-50 px-4 text-center text-sm text-slate-600 md:h-[420px]">
                  Upload and click <b className="mx-1 text-slate-900">Plushify!</b>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!file || loading}
              onClick={onConvert}
            >
              {loading ? 'Plushifying...' : 'Plushify!'}
            </button>

            {resultUrl ? (
              <a
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                href={resultUrl}
                download={downloadName}
              >
                Download
              </a>
            ) : (
              <div className="hidden sm:block" />
            )}
          </div>

          {error ? (
            <div
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

