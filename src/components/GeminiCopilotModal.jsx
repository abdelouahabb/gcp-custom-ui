import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Sparkles,
  X,
  Send,
  Zap,
  CheckCircle2,
  ArrowRight,
  Command,
} from 'lucide-react';

export default function GeminiCopilotModal({
  isOpen,
  onClose,
  projectId,
  initialPrompt = '',
  contextSummary,
  onTriggerAction,
}) {
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Connected to live project **${projectId}** via OAuth2 session. Ask me to run Root Cause Analysis (RCA), audit live Cloud Storage buckets, or calculate FinOps rightsizing savings.`,
      suggestedAction: {
        label: 'Run RCA on Canary Latency Drift',
        actionType: 'ROLLBACK_CANARY',
        targetId: 'sim-run-gemini-gateway',
      },
    },
  ]);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (overridePrompt) => {
    const q = (overridePrompt ?? prompt).trim();
    if (!q || loading) return;
    setPrompt('');
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: q },
    ]);
    setLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/ai-copilot`,
        {
          prompt: q,
          contextSummary,
        }
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: res.data.reply,
          suggestedAction: res.data.suggestedAction,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: `Error contacting Gemini SRE Co-Pilot: ${err.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Run RCA on the latency spike at 21:00',
    'Analyze FinOps cost savings for ' + projectId,
    'Audit live GCS buckets & security posture',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#ffffff] dark:bg-[#0c0c0f] rounded-[12px] border border-zinc-200 dark:border-zinc-800 shadow-2xl w-full max-w-xl p-6 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-emerald-500/20 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <span>Gemini 2026 Cloud SRE Co-Pilot</span>
                <span className="text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                  {projectId}
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Grounded in live Resource Manager, Cloud Storage, Service Usage & Cloud Logging APIs
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close Gemini Co-Pilot"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt Chips */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {quickPrompts.map((qp) => (
            <button
              key={qp}
              type="button"
              disabled={loading}
              onClick={() => handleSend(qp)}
              className="text-[11px] bg-zinc-100 dark:bg-zinc-900 hover:bg-blue-500/15 hover:text-blue-600 dark:hover:text-blue-400 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Conversation Thread */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white ml-8'
                  : 'bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 mr-4'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>

              {m.suggestedAction && (
                <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Suggested 1-Tap Action:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onTriggerAction(m.suggestedAction);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{m.suggestedAction.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-xl h-16 w-3/4 p-3 text-xs text-zinc-500">
              Synthesizing live GCP telemetry...
            </div>
          )}
        </div>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Command className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Gemini SRE Co-Pilot anything about your GCP project..."
              aria-label="Ask Gemini SRE Co-Pilot"
              className="w-full bg-[#ffffff] dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-[8px] pl-9 pr-3 py-[8px] text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-zinc-950 dark:text-zinc-100 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="inline-flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-[#000000] rounded-[8px] px-[16px] py-[8px] text-xs font-[600] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
}
