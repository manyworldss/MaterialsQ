/* Typed messaging between popup and the active tab's content script. */

import type { Analysis } from '../engine/types';

export interface GetAnalysisRequest {
  type: 'MIQ_GET_ANALYSIS';
}
export interface AnalysisResponse {
  type: 'MIQ_ANALYSIS';
  analysis: Analysis | null;
  /** Present when the page loaded but wasn't a scorable product. */
  reason?: 'no-product' | 'low-confidence' | 'unsupported';
}
export interface OpenScorecardMessage {
  type: 'MIQ_OPEN_SCORECARD';
}
export interface RecheckRequest {
  type: 'MIQ_RECHECK';
}

export type MIQMessage = GetAnalysisRequest | AnalysisResponse | OpenScorecardMessage | RecheckRequest;

/** Ask the active tab's content script for its current analysis. */
export async function requestActiveTabAnalysis(): Promise<AnalysisResponse> {
  // Outside an extension context (e.g. a plain-browser preview) fall back to demo.
  if (typeof chrome === 'undefined' || !chrome.tabs) return { type: 'MIQ_ANALYSIS', analysis: null, reason: 'unsupported' };
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { type: 'MIQ_ANALYSIS', analysis: null, reason: 'unsupported' };
  try {
    const res = (await chrome.tabs.sendMessage(tab.id, { type: 'MIQ_GET_ANALYSIS' } satisfies GetAnalysisRequest)) as
      | AnalysisResponse
      | undefined;
    return res ?? { type: 'MIQ_ANALYSIS', analysis: null, reason: 'unsupported' };
  } catch {
    // No content script on this tab (not a supported retailer).
    return { type: 'MIQ_ANALYSIS', analysis: null, reason: 'unsupported' };
  }
}

/** Ask the active tab to re-extract and re-score from scratch, then return the
    fresh analysis (used by the re-check button). */
export async function recheckActiveTab(): Promise<AnalysisResponse> {
  if (typeof chrome === 'undefined' || !chrome.tabs) return { type: 'MIQ_ANALYSIS', analysis: null, reason: 'unsupported' };
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { type: 'MIQ_ANALYSIS', analysis: null, reason: 'unsupported' };
  try {
    const res = (await chrome.tabs.sendMessage(tab.id, { type: 'MIQ_RECHECK' } satisfies RecheckRequest)) as AnalysisResponse | undefined;
    return res ?? { type: 'MIQ_ANALYSIS', analysis: null, reason: 'unsupported' };
  } catch {
    return { type: 'MIQ_ANALYSIS', analysis: null, reason: 'unsupported' };
  }
}
