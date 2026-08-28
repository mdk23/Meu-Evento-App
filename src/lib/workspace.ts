export type Workspace = 'VENUE' | 'EVENT';

const STORAGE_KEY = 'aurelia-workspace';

/** Sets the active workspace and persists it. Call from anywhere — not tied to any one component. */
export function setActiveWorkspace(workspace: Workspace) {
  try {
    localStorage.setItem(STORAGE_KEY, workspace);
  } catch {
    // localStorage unavailable (private browsing, etc.) — the choice just won't persist across reloads.
  }
}

/** Reads the active workspace. Client-only — never call during SSR. */
export function getActiveWorkspace(): Workspace | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'VENUE' || stored === 'EVENT' ? stored : null;
  } catch {
    return null;
  }
}
