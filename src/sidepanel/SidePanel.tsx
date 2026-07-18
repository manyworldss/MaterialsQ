import { useCallback, useEffect, useState } from 'react';
import { Scorecard } from '../ui/Scorecard';
import { BetterOptions } from '../ui/BetterOptions';
import { ScrollHint } from '../ui/ScrollHint';
import { analyze } from '../engine/score';
import type { Analysis } from '../engine/types';
import { SAMPLE_TEE } from '../engine/samples';
import { recheckActiveTab, requestActiveTabAnalysis } from '../lib/messages';
import { fetchExplanation } from '../lib/explain';

/* Persistent, docked scorecard. Unlike the popup it stays open and updates live
   as you move between product pages — so you can browse and compare without
   re-opening anything. It doesn't cover the page (Chrome reflows around it). */
export function SidePanel() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const load = useCallback(() => {
    requestActiveTabAnalysis().then((res) => {
      if (res.analysis) {
        setAnalysis(res.analysis);
        setIsDemo(false);
      } else {
        setAnalysis(analyze(SAMPLE_TEE));
        setIsDemo(true);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
    if (typeof chrome === 'undefined' || !chrome.tabs) return; // preview / non-extension
    const onActivated = () => load();
    const onUpdated = (_id: number, info: chrome.tabs.TabChangeInfo) => {
      if (info.status === 'complete') load();
    };
    // Content scripts broadcast MIQ_VERDICT when they score a new product
    // (covers SPA navigation within the same tab).
    const onMsg = (m: { type?: string }) => {
      if (m?.type === 'MIQ_VERDICT') setTimeout(load, 300);
    };
    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.runtime.onMessage.addListener(onMsg);
    return () => {
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.runtime.onMessage.removeListener(onMsg);
    };
  }, [load]);

  // Fetch the AI explanation whenever the analysis changes (tab switch, SPA nav,
  // re-check). No-ops unless the setting is on; card always renders from rules.
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

  const openOptions = () => chrome.runtime.openOptionsPage();
  const refresh = async () => {
    const res = await recheckActiveTab();
    if (res.analysis) {
      setAnalysis(res.analysis);
      setIsDemo(false);
    }
    return res.analysis != null;
  };

  if (loading || !analysis) {
    return <div style={{ padding: 20, color: 'var(--fg-3)', fontSize: 'var(--text-sm)' }}>Analyzing…</div>;
  }

  return (
    <div>
      <Scorecard analysis={analysis} isDemo={isDemo} aiExplanation={aiExplanation} onOpenOptions={openOptions} onRefresh={refresh}>
        <BetterOptions options={analysis.betterOptions} />
      </Scorecard>
      <ScrollHint />
    </div>
  );
}
