import { useEffect, useState } from 'react';
import { PanelRight } from 'lucide-react';
import { IconButton } from '../design-system/core';
import { Scorecard } from '../ui/Scorecard';
import { ScrollHint } from '../ui/ScrollHint';
import { analyze } from '../engine/score';
import type { Analysis } from '../engine/types';
import { SAMPLE_TEE } from '../engine/samples';
import { recheckActiveTab, requestActiveTabAnalysis } from '../lib/messages';

export function Popup() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

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
