import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { decide, getItem } from '../../shared/rules.js';
import { matchPredictions, suggestItems } from '../../shared/vision/classMap.js';
import { analyzeImage } from '../../shared/vision/contamination.js';
import { POINTS } from '../../shared/points.js';
import { levelFor } from '../../shared/progress.js';
import { classify, cropToGuide, loadModel, loadImageFile, toCanvas } from '../lib/vision.js';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import ItemSearch from '../components/ItemSearch.jsx';
import VerdictCard from '../components/VerdictCard.jsx';

const LEVEL_OPTIONS = {
  grease: [
    { level: 'clean', label: 'Clean and dry' },
    { level: 'light', label: 'Some greasy spots' },
    { level: 'heavy', label: 'Soaked or covered in food' },
  ],
  residue: [
    { level: 'clean', label: 'Empty and rinsed' },
    { level: 'light', label: 'Has food or liquid left' },
  ],
};

function useCamera(active) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) return undefined;
    let stream;
    let cancelled = false;
    setError(null);
    setReady(false);
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser does not support camera access.');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) return;
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.name === 'NotAllowedError'
              ? 'Camera permission was denied. Allow camera access in your browser settings, or upload a photo instead.'
              : err.message || 'Could not start the camera.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      setReady(false);
    };
  }, [active]);

  return { videoRef, error, ready };
}

function drawOverlay(canvas, capture, analysis) {
  if (!canvas || !capture) return;
  canvas.width = capture.canvas.width;
  canvas.height = capture.canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(capture.canvas, 0, 0);
  if (!analysis?.cells) return;
  const n = analysis.gridSize;
  const cw = canvas.width / n;
  const ch = canvas.height / n;
  analysis.cells.forEach((cell, i) => {
    const x = (i % n) * cw;
    const y = Math.floor(i / n) * ch;
    if (cell.flagged) {
      ctx.fillStyle = 'rgba(198, 40, 40, 0.42)';
      ctx.fillRect(x, y, cw, ch);
      ctx.strokeStyle = '#C62828';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, cw - 2, ch - 2);
    } else if (cell.isMaterial) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 1, y + 1, cw - 2, ch - 2);
    }
  });
}

export default function Scan() {
  const { user, stats, refresh } = useAuth();
  const [mode, setMode] = useState('camera');
  const [capture, setCapture] = useState(null); // { canvas, source }
  const [modelState, setModelState] = useState('idle');
  const [predictions, setPredictions] = useState([]);
  const [match, setMatch] = useState(null);
  const [itemId, setItemId] = useState(null);
  const [override, setOverride] = useState(null);
  const [liveLabel, setLiveLabel] = useState(null);
  const [logState, setLogState] = useState(null);
  const [busy, setBusy] = useState(false);
  const overlayRef = useRef(null);
  const fileRef = useRef(null);

  const cameraActive = mode === 'camera' && !capture;
  const { videoRef, error: cameraError, ready: cameraReady } = useCamera(cameraActive);

  // Start downloading the in-browser object recognizer as soon as the page opens.
  useEffect(() => {
    setModelState('loading');
    loadModel()
      .then(() => setModelState('ready'))
      .catch(() => setModelState('error'));
  }, []);

  // Live preview label while the camera is running.
  useEffect(() => {
    if (!cameraActive || !cameraReady || modelState !== 'ready') return undefined;
    let stopped = false;
    const tick = async () => {
      if (stopped || !videoRef.current) return;
      try {
        const preds = await classify(cropToGuide(videoRef.current, 224), 3);
        if (stopped) return;
        const m = matchPredictions(preds);
        setLiveLabel(m ? getItem(m.itemId).name : null);
      } catch {
        // ignore transient frame errors
      }
      if (!stopped) timer = setTimeout(tick, 1200);
    };
    let timer = setTimeout(tick, 300);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [cameraActive, cameraReady, modelState, videoRef]);

  const item = itemId ? getItem(itemId) : null;

  const analysis = useMemo(() => {
    if (!capture || !item?.contaminationCheck) return null;
    const c = capture.canvas;
    const imageData = c.getContext('2d').getImageData(0, 0, c.width, c.height);
    return analyzeImage(imageData, item.contaminationCheck);
  }, [capture, item]);

  const level = override || analysis?.level || null;
  const verdict = useMemo(() => (itemId ? decide(itemId, level ? { level } : null) : null), [itemId, level]);

  useEffect(() => {
    drawOverlay(overlayRef.current, capture, override ? null : analysis);
  }, [capture, analysis, override]);

  const runClassification = useCallback(async (canvas, source) => {
    setCapture({ canvas, source });
    setPredictions([]);
    setMatch(null);
    setItemId(null);
    setOverride(null);
    setLogState(null);
    setBusy(true);
    try {
      const preds = await classify(canvas, 5);
      setPredictions(preds);
      const m = matchPredictions(preds);
      setMatch(m);
      if (m) setItemId(m.itemId);
    } catch {
      setModelState('error');
    } finally {
      setBusy(false);
    }
  }, []);

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !cameraReady) return;
    runClassification(cropToGuide(video), 'camera');
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const img = await loadImageFile(file);
      runClassification(toCanvas(img), 'upload');
    } catch (err) {
      setLogState({ error: err.message });
    }
  };

  const reset = () => {
    setCapture(null);
    setPredictions([]);
    setMatch(null);
    setItemId(null);
    setOverride(null);
    setLogState(null);
  };

  const chooseItem = (it) => {
    setItemId(it.id);
    setOverride(null);
    setLogState(null);
  };

  const contaminationFound = Boolean(verdict && (verdict.contaminated || verdict.item.alert));
  const potentialPoints = POINTS.SCAN + (contaminationFound ? POINTS.CONTAMINATION_BONUS : 0);

  const logScan = async () => {
    setLogState({ saving: true });
    try {
      const res = await api('/scans', {
        method: 'POST',
        body: { itemId, contaminationFound, level, source: capture?.source || 'search' },
      });
      const before = levelFor(stats?.competitionPoints || 0).number;
      setLogState({ points: res.points, capped: res.capped });
      const me = await refresh();
      if (me?.level && me.level.number > before) setLogState((s) => ({ ...s, levelUp: me.level.name }));
    } catch (err) {
      setLogState({ error: err.message });
    }
  };

  const needsManualLevel =
    item?.contaminationCheck && (!capture || analysis?.level === 'unknown' || item.contaminationCheck === 'residue');

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-4xl">What are you tossing?</h1>

      {!capture && (
        <div className="flex rounded-full bg-brand-100 p-1" role="tablist">
          {[
            ['camera', 'Camera'],
            ['upload', 'Upload photo'],
          ].map(([m, label]) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full py-2 font-heading font-semibold ${mode === m ? 'bg-white text-brand-800' : 'text-brand-800/70'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl bg-ink">
        <div className="relative aspect-square sm:aspect-[4/3]">
          {capture ? (
            <canvas ref={overlayRef} className="h-full w-full object-contain" />
          ) : mode === 'camera' ? (
            <>
              <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
              {!cameraReady && !cameraError && (
                <p className="absolute inset-0 flex items-center justify-center text-white/70">Starting camera...</p>
              )}
              {cameraError && <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-white">{cameraError}</p>}
              <div className="pointer-events-none absolute left-1/2 top-1/2 aspect-square h-[70%] -translate-x-1/2 -translate-y-1/2 rounded-3xl border-4 border-dashed border-white/70" />
              {cameraReady && (
                <span className="pill absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white/90 text-ink">
                  {liveLabel ? `Looks like: ${liveLabel}` : 'Fit the item in the box'}
                </span>
              )}
            </>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="flex h-full w-full items-center justify-center font-heading text-2xl font-semibold text-white/80 hover:text-white"
            >
              Tap to choose a photo
            </button>
          )}
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/60 font-heading text-2xl font-semibold text-white">
              Checking...
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        {capture ? (
          <button className="btn-secondary" onClick={reset}>Scan something else</button>
        ) : mode === 'camera' ? (
          <button className="btn-primary btn-big" onClick={takePhoto} disabled={!cameraReady || busy}>Scan it</button>
        ) : (
          <button className="btn-primary btn-big" onClick={() => fileRef.current?.click()} disabled={busy}>Choose photo</button>
        )}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      </div>
      {modelState === 'loading' && <p className="text-center text-sm text-ash">Loading the object recognizer...</p>}
      {modelState === 'error' && (
        <p className="text-center text-sm text-ash">Photo recognition is unavailable right now. Search for the item instead.</p>
      )}

      {capture && !busy && !match && !item && (
        <div className="card p-5">
          <p className="font-heading text-xl font-semibold">Hmm, which one is it?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestItems(predictions).map((id) => (
              <button key={id} type="button" className="btn-secondary !px-4 !py-1.5 !text-base" onClick={() => chooseItem(getItem(id))}>
                {getItem(id).name.replace(/ \(.*\)$/, '')}
              </button>
            ))}
          </div>
        </div>
      )}

      {item?.contaminationCheck && (needsManualLevel || override) && (
        <div className="card p-5">
          <p className="font-heading text-xl font-semibold">
            {item.contaminationCheck === 'grease' ? 'How does it look?' : 'Is it empty and rinsed?'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LEVEL_OPTIONS[item.contaminationCheck].map((o) => (
              <button
                key={o.level}
                onClick={() => setOverride(o.level)}
                className={`${level === o.level ? 'btn-primary' : 'btn-secondary'} !px-4 !py-1.5 !text-base`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {capture && analysis && !override && analysis.level !== 'unknown' && (
        <div className="card p-5">
          <p className="font-heading text-xl font-semibold">Grease and food check</p>
          {analysis.kind === 'grease' ? (
            <p className="mt-1">
              {analysis.flaggedCells === 0
                ? 'No grease spotted. Nice!'
                : `${analysis.flaggedCells} of ${analysis.materialCells} sections look greasy. The red squares on your photo go in the trash.`}
            </p>
          ) : (
            <p className="mt-1">
              {analysis.level === 'light' ? 'Some spots look like leftover food. They are marked in red.' : 'Looks clean. Give it a rinse anyway.'}
            </p>
          )}
          <button className="mt-2 text-sm font-semibold text-brand-700 underline" onClick={() => setOverride(analysis.level)}>
            Not right? Set it yourself
          </button>
        </div>
      )}

      <VerdictCard verdict={verdict} />

      {verdict && (
        <div className="text-center">
          {user ? (
            logState?.points !== undefined ? (
              <div className="rounded-3xl bg-brand-400 p-5">
                <p className="font-heading text-4xl font-bold">+{logState.points} points</p>
                {logState.levelUp && <p className="mt-1 font-heading text-xl font-semibold">Level up! You're a {logState.levelUp}.</p>}
                {logState.capped && <p className="mt-1 text-sm">You hit today's scan limit. Come back tomorrow.</p>}
              </div>
            ) : (
              <>
                <button className="btn-primary btn-big w-full" onClick={logScan} disabled={logState?.saving}>
                  I sorted it right! +{potentialPoints}
                </button>
                {contaminationFound && <p className="mt-2 text-sm text-ash">Includes {POINTS.CONTAMINATION_BONUS} bonus points for catching a problem.</p>}
              </>
            )
          ) : (
            <Link to="/register" className="btn-primary btn-big w-full">Join to earn +{potentialPoints} points</Link>
          )}
          {logState?.error && <p className="mt-2 text-sm text-stop">{logState.error}</p>}
        </div>
      )}

      <div className="card p-5">
        <label className="label">{item ? 'Wrong item? Search for it' : 'Or search for it'}</label>
        <ItemSearch onSelect={chooseItem} />
        <Link to="/guide" className="mt-3 inline-block text-sm font-semibold text-brand-700 underline">Browse every item</Link>
      </div>
    </div>
  );
}
