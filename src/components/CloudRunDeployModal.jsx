import React, { useState } from 'react';
import { Rocket, X, Copy, Check, ShieldCheck, Globe } from 'lucide-react';

export default function CloudRunDeployModal({ isOpen, onClose, projectId }) {
  const [copiedIdx, setCopiedIdx] = useState(null);

  if (!isOpen) return null;

  const deployCmd = `gcloud run deploy cloudpulse-2026 --source . --project=${
    projectId || 'YOUR_PROJECT_ID'
  } --region=us-east1 --allow-unauthenticated`;

  const copyText = (text, idx) => {
    navigator.clipboard?.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#202124] rounded-[12px] border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-950 dark:text-zinc-50">
                Deploy & Share Your Own CloudPulse 2026 on Cloud Run
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Included multi-stage <code className="font-mono">Dockerfile</code> bundles the PWA + API Bridge on port 8080.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between font-semibold text-zinc-900 dark:text-zinc-100">
              <span>1-Command Cloud Run Source Deployment:</span>
              <button
                type="button"
                onClick={() => copyText(deployCmd, 1)}
                className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-400 font-mono"
              >
                {copiedIdx === 1 ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-white dark:bg-zinc-950 text-emerald-400 font-mono text-[11px] whitespace-pre-wrap break-all">
              $ {deployCmd}
            </pre>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Stateless Multi-Account Safety</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Each user connects their own Google Account via browser OAuth token or ADC JSON (<code className="font-mono">x-gcp-access-token</code> header). Credentials are never persisted on disk.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Installable Android PWA</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Once deployed to Cloud Run (HTTPS), open the URL on Android Chrome and tap <strong>"Install App"</strong> for a native full-screen experience.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-5 py-2 text-xs font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
