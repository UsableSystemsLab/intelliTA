import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Play, Eraser, ExternalLink, LogIn, GripHorizontal } from 'lucide-react';

const BOOTSTRAP = `
<script>
(function () {
  var send = function (type, args) {
    try {
      var text = Array.prototype.slice.call(args).map(function (a) {
        if (a instanceof Error) return a.stack || a.message;
        if (typeof a === 'object') { try { return JSON.stringify(a); } catch (e) { return String(a); } }
        return String(a);
      }).join(' ');
      parent.postMessage({ source: 'preview', type: type, text: text }, '*');
    } catch (e) {}
  };
  ['log', 'warn', 'error', 'info'].forEach(function (level) {
    var orig = console[level].bind(console);
    console[level] = function () { send(level, arguments); orig.apply(console, arguments); };
  });
  window.addEventListener('error', function (e) {
    send('error', [e.message + ' (' + (e.filename || '') + ':' + e.lineno + ':' + e.colno + ')']);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    send('error', ['Unhandled promise rejection: ' + (r && (r.stack || r.message) || r)]);
  });
})();
</script>
`;

function buildDoc(files) {
    const htmlFile = files.find((f) => f.name.toLowerCase().endsWith('.html'));
    const html = htmlFile?.content ?? '';
    const css = files
        .filter((f) => f.name.toLowerCase().endsWith('.css'))
        .map((f) => f.content)
        .join('\n');
    const js = files
        .filter((f) => f.name.toLowerCase().endsWith('.js'))
        .map((f) => f.content)
        .join('\n');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
${BOOTSTRAP}
<style>${css}</style>
</head>
<body>
${html}
<script>
try {
${js}
} catch (e) { console.error(e); }
</script>
</body>
</html>`;
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function PreviewPane({ files, onFloatingChange }) {
    const { t } = useTranslation();
    const [runId, setRunId] = useState(0);
    const [logs, setLogs] = useState([]);
    const [doc, setDoc] = useState('');
    const [floating, setFloating] = useState(false);
    const [pos, setPos] = useState({ x: 80, y: 80 });
    const [size, setSize] = useState({ w: 520, h: 420 });
    const [drag, setDrag] = useState(null); // { mode: 'move'|'resize', startX, startY, ... }
    const inlineIframeRef = useRef(null);
    const floatIframeRef = useRef(null);

    const hasHtml = useMemo(
        () => files.some((f) => f.name.toLowerCase().endsWith('.html')),
        [files]
    );

    const handleRun = useCallback(() => {
        setLogs([]);
        setDoc(buildDoc(files));
        setRunId((id) => id + 1);
    }, [files]);

    const handleClear = useCallback(() => setLogs([]), []);

    const handlePopOut = useCallback(() => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const w = Math.min(560, vw - 80);
        const h = Math.min(440, vh - 120);
        setSize({ w, h });
        setPos({ x: Math.max(20, vw - w - 40), y: Math.max(20, vh - h - 80) });
        setFloating(true);
        if (runId === 0) {
            setDoc(buildDoc(files));
            setRunId(1);
        }
    }, [files, runId]);

    const handlePopIn = useCallback(() => setFloating(false), []);

    useEffect(() => {
        if (onFloatingChange) onFloatingChange(floating);
    }, [floating, onFloatingChange]);

    // Drag / resize
    useEffect(() => {
        if (!drag) return;
        const onMove = (e) => {
            if (drag.mode === 'move') {
                const nx = clamp(drag.origX + (e.clientX - drag.startX), 0, window.innerWidth - 80);
                const ny = clamp(drag.origY + (e.clientY - drag.startY), 0, window.innerHeight - 40);
                setPos({ x: nx, y: ny });
            } else if (drag.mode === 'resize') {
                const nw = clamp(drag.origW + (e.clientX - drag.startX), 280, window.innerWidth - pos.x);
                const nh = clamp(drag.origH + (e.clientY - drag.startY), 200, window.innerHeight - pos.y);
                setSize({ w: nw, h: nh });
            }
        };
        const onUp = () => setDrag(null);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [drag, pos.x, pos.y]);

    const startMove = (e) => {
        e.preventDefault();
        setDrag({ mode: 'move', startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y });
    };
    const startResize = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDrag({ mode: 'resize', startX: e.clientX, startY: e.clientY, origW: size.w, origH: size.h });
    };

    useEffect(() => {
        const onMessage = (e) => {
            const inlineWin = inlineIframeRef.current?.contentWindow;
            const floatWin = floatIframeRef.current?.contentWindow;
            if (e.source !== inlineWin && e.source !== floatWin) return;
            if (!e.data || e.data.source !== 'preview') return;
            setLogs((prev) => [...prev, { type: e.data.type, text: e.data.text }]);
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, []);

    if (!hasHtml) {
        return (
            <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                {t('addHtmlHint')}
            </div>
        );
    }

    const iframeEl = (ref) => (
        <iframe
            key={runId}
            ref={ref}
            sandbox="allow-scripts"
            srcDoc={doc}
            title="preview"
            className="w-full h-full border-0 bg-white"
        />
    );

    return (
        <div className="h-full flex flex-col bg-white" dir="ltr">
            <div className="h-9 shrink-0 flex items-center justify-between px-3 bg-gray-900 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRun}
                        className="flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                    >
                        <Play className="w-3 h-3" />
                        {t('runLabel')}
                    </button>
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 text-xs transition-colors"
                        title={t('clearLogsLabel')}
                    >
                        <Eraser className="w-3 h-3" />
                    </button>
                    {floating ? (
                        <button
                            onClick={handlePopIn}
                            className="flex items-center gap-1.5 px-2 py-1 rounded text-gray-300 hover:text-white hover:bg-gray-800 text-xs transition-colors"
                            title={t('popIn')}
                        >
                            <LogIn className="w-3 h-3" />
                            <span>{t('popIn')}</span>
                        </button>
                    ) : (
                        <button
                            onClick={handlePopOut}
                            className="flex items-center gap-1.5 px-2 py-1 rounded text-gray-300 hover:text-white hover:bg-gray-800 text-xs transition-colors"
                            title={t('popOut')}
                        >
                            <ExternalLink className="w-3 h-3" />
                            <span>{t('popOut')}</span>
                        </button>
                    )}
                </div>
                <span className="text-xs text-gray-500">{t('runCount', { n: runId })}</span>
            </div>
            <div className="flex-1 min-h-0 bg-white">
                {floating ? (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-gray-50">
                        {t('popIn')}
                    </div>
                ) : runId > 0 ? (
                    iframeEl(inlineIframeRef)
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        {t('pressRunHint')}
                    </div>
                )}
            </div>
            {logs.length > 0 && (
                <div className="max-h-32 overflow-auto border-t border-gray-800 bg-[#0d1117] px-3 py-2 font-mono text-xs">
                    {logs.map((l, i) => (
                        <div
                            key={i}
                            className={
                                l.type === 'error'
                                    ? 'text-red-400'
                                    : l.type === 'warn'
                                    ? 'text-amber-400'
                                    : l.type === 'info'
                                    ? 'text-blue-400'
                                    : 'text-gray-300'
                            }
                        >
                            <span className="text-gray-600">{'›'}</span> {l.text}
                        </div>
                    ))}
                </div>
            )}

            {floating && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        top: pos.y,
                        left: pos.x,
                        width: size.w,
                        height: size.h,
                        zIndex: 9999,
                    }}
                    className="rounded-lg shadow-2xl border border-gray-700 bg-white overflow-hidden flex flex-col"
                >
                    <div
                        onMouseDown={startMove}
                        className="h-9 shrink-0 flex items-center justify-between px-2 bg-gray-900 text-gray-200 cursor-move select-none"
                    >
                        <div className="flex items-center gap-2 text-xs">
                            <GripHorizontal className="w-4 h-4 text-gray-500" />
                            <span>{t('previewTab')}</span>
                        </div>
                        <div
                            className="flex items-center gap-1"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleRun}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                            >
                                <Play className="w-3 h-3" />
                                {t('runLabel')}
                            </button>
                            <button
                                onClick={handleClear}
                                className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                                title={t('clearLogsLabel')}
                            >
                                <Eraser className="w-3 h-3" />
                            </button>
                            <button
                                onClick={handlePopIn}
                                className="flex items-center gap-1 px-2 py-1 rounded text-gray-300 hover:text-white hover:bg-gray-800 text-xs transition-colors"
                                title={t('popIn')}
                            >
                                <LogIn className="w-3 h-3" />
                                <span>{t('popIn')}</span>
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0 bg-white relative">
                        {runId > 0 ? iframeEl(floatIframeRef) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                {t('pressRunHint')}
                            </div>
                        )}
                        {drag && (
                            <div className="absolute inset-0" />
                        )}
                    </div>
                    <div
                        onMouseDown={startResize}
                        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
                        style={{
                            background: 'linear-gradient(135deg, transparent 50%, #6b7280 50%)',
                        }}
                    />
                </div>,
                document.body
            )}
        </div>
    );
}
