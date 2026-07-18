import { useEffect, useState } from 'react';
import { PanelRight } from 'lucide-react';
import { IconButton } from '../design-system/core';
import { Scorecard } from '../ui/Scorecard';
import { ScrollHint } from '../ui/ScrollHint';
import { analyze } from '../engine/score';
import type { Analysis } from '../engine/types';
import { SAMPLE_TEE } from '../engine/samples';
import { recheckActiveTab, requestActiveTabAnalysis } from '../lib/messages';
import { fetchExplanation } from '../lib/explain';

export function Popup() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  // Fetch the AI explanation when the analysis changes. No-ops (returns null)
  // unless the setting is on and the backend answers, so the card renders
  // immediately from rules and the explanation fills in when/if it arrives.
  useEffect(() => {
    if (!analysis) return;
    let live = true;
    setAiExplanation(null);
    fetchExplanation(analysis).then((t) => {
      if (live) setAiExplanation(t);
    });
    return () => {
      live = false;
    };
  }, [analysis]);

  useEffect(() => {
    requestActiveTabAnalysis().then((res) => {
      if (res.analysis) setAnalysis(res.analysis);
      else {
        setAnalysis(analyze(SAMPLE_TEE));
        setIsDemo(true);
      }
      setLoading(false);
    });
  }, []);

  const openOptions = () => chrome.runtime.openOptionsPage();
  const refresh = async () => {
    const res = await recheckActiveTab();
    if (res.analysis) {
      setAnalysis(res.analysis);
      setIsDemo(false);
    }
    return res.analysis != null;
  };
  const openPanel = async () => {
    try {
      const win = await chrome.windows.getCurrent();
      if (win.id != null) await chrome.sidePanel.open({ windowId: win.id });
      window.close();
    } catch {
      /* side panel unavailable */
    }
  };

  if (loading || !analysis) {
    return <div style={{ width: 'var(--popup-w)', padding: 20, boxSizing: 'border-box', color: 'var(--fg-3)', fontSize: 'var(--text-sm)' }}>Analyzing…</div>;
  }

  return (
    <div style={{ width: 'var(--popup-w)', boxSizing: 'border-box' }}>
      <Scorecard
        analysis={analysis}
        isDemo={isDemo}
        aiExplanation={aiExplanation}
        onOpenOptions={openOptions}
        onRefresh={refresh}
        headerExtra={
          <IconButton label="Open side panel" size="sm" onClick={openPanel}>
            <PanelRight size={14} />
          </IconButton>
        }
      />
      <ScrollHint />
    </div>
  );
}
