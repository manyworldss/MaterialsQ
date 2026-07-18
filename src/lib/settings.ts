/* User settings, persisted in chrome.storage.sync. */

export interface Settings {
  /** Inject the inline badge onto retailer product pages. */
  showInlineBadge: boolean;
  /** Only surface a verdict when extraction confidence clears this bar. */
  minConfidence: number;
  /** Suggest a cheaper alternative when the verdict isn't "worth it". */
  showAlternatives: boolean;
  /** AI review summaries. OFF until the AI backend goes live at launch — when
   *  false the extension never contacts the backend and scores fully locally. */
  reviewSummaries: boolean;
  /** AI plain-English explanation of the verdict. OFF until the backend is live.
   *  The AI only phrases the rule-based facts; it never sets the score. */
  aiExplanations: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  showInlineBadge: true,
  minConfidence: 0.5,
  showAlternatives: true,
  reviewSummaries: false,
  aiExplanations: false,
};

const KEY = 'miq_settings';

export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[KEY] as Partial<Settings> | undefined) };
}

export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await chrome.storage.sync.set({ [KEY]: next });
  return next;
}

export function onSettingsChanged(cb: (s: Settings) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'sync' && changes[KEY]) cb({ ...DEFAULT_SETTINGS, ...(changes[KEY].newValue as Partial<Settings>) });
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
