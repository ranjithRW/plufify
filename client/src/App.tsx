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
    <div className="page">
      <div className="card">
        <h1>Plushie Creator</h1>
        <p className="subtitle">
          Upload a photo and get a cozy, adorable plushie-style result.
        </p>

        <div className="uploadRow">
          <input
            className="fileInput"
            type="file"
            accept={acceptLabel}
            onChange={(e) => {
              const next = e.target.files?.[0] || null;
              setFile(next);
              setResultUrl(null);
              setError(null);
            }}
          />
        </div>

        <div className="imagesGrid">
          <div className="imgBlock">
            <div className="imgTitle">Original</div>
            {previewUrl ? (
              <img className="imgPreview" src={previewUrl} alt="Original upload preview" />
            ) : (
              <div className="placeholder">Choose an image to preview.</div>
            )}
          </div>

          <div className="imgBlock">
            <div className="imgTitle">Plushie</div>
            {resultUrl ? (
              <img className="imgPreview" src={resultUrl} alt="Plushie result" />
            ) : (
              <div className="placeholder">
                Upload and click <b>Plushify!</b>
              </div>
            )}
          </div>
        </div>

        <button className="primaryBtn" disabled={!file || loading} onClick={onConvert}>
          {loading ? 'Plushifying...' : 'Plushify!'}
        </button>

        {resultUrl ? (
          <a className="secondaryBtn" href={resultUrl} download={downloadName}>
            Download plushie image
          </a>
        ) : null}

        {error ? (
          <div className="errorBox" role="alert">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}

