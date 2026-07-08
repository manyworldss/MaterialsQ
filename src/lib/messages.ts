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

export type MIQMessage = GetAnalysisRequest | AnalysisResponse | OpenScorecardMessage;

/** Ask the active tab's content script for its current analysis. */
export async function requestActiveTabAnalysis(): Promise<AnalysisResponse> {
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
