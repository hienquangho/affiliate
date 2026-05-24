import { 
  BrandBuilderProject, 
  ScriptWriterProject, 
  ScriptOptimizerProject, 
  ContentScannerProject,
  SubAppId
} from "../types";

export function getHistory<T>(appId: SubAppId): T[] {
  try {
    const data = localStorage.getItem(`affiliate_app_${appId}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Error reading history for ${appId}`, e);
    return [];
  }
}

export function saveHistory<T>(appId: SubAppId, history: T[]): void {
  try {
    localStorage.setItem(`affiliate_app_${appId}`, JSON.stringify(history));
  } catch (e) {
    console.error(`Error saving history for ${appId}`, e);
  }
}

export function addProjectToHistory<T extends { id: string; createdAt: string; title: string }>(
  appId: SubAppId, 
  project: T
): T[] {
  const current = getHistory<T>(appId);
  // If editing an existing project, replace it; otherwise add as first entry
  const existsIdx = current.findIndex(p => p.id === project.id);
  let updated: T[];
  if (existsIdx >= 0) {
    updated = [...current];
    updated[existsIdx] = project;
  } else {
    updated = [project, ...current];
  }
  saveHistory(appId, updated);
  return updated;
}

export function deleteProjectFromHistory<T extends { id: string }>(
  appId: SubAppId,
  projectId: string
): T[] {
  const current = getHistory<T>(appId);
  const updated = current.filter(p => p.id !== projectId);
  saveHistory(appId, updated);
  return updated;
}

export function clearHistory(appId: SubAppId): void {
  localStorage.removeItem(`affiliate_app_${appId}`);
}
