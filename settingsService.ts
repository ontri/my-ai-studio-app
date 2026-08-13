import { GymSettings, MembershipPlan } from '../types';
import {
  getGymSettingsFromStorage,
  saveGymSettingsToStorage,
  resetDataToDefaults,
} from './storage';

/**
 * Retrieves the current gym settings
 */
export function getSettings(): GymSettings {
  return getGymSettingsFromStorage();
}

/**
 * Updates gym settings
 */
export function updateSettings(newSettings: GymSettings): GymSettings {
  saveGymSettingsToStorage(newSettings);
  return newSettings;
}

/**
 * Adds a new membership plan
 */
export function addPlan(planData: Omit<MembershipPlan, 'id'>): MembershipPlan {
  const settings = getSettings();
  const newId = `plan-${Date.now()}`;
  const duration = planData.duration || planData.durationMonths || 1;
  const unit = planData.durationUnit || 'Months';

  const newPlan: MembershipPlan = {
    ...planData,
    id: newId,
    duration,
    durationMonths: unit === 'Months' ? duration : Math.max(1, Math.round(duration / 30)),
    durationUnit: unit,
    isActive: planData.isActive !== undefined ? planData.isActive : true,
  };

  const updatedPlans = [...(settings.plans || []), newPlan];
  updateSettings({ ...settings, plans: updatedPlans });
  return newPlan;
}

/**
 * Updates an existing membership plan
 */
export function updatePlan(planToUpdate: MembershipPlan): MembershipPlan {
  const settings = getSettings();
  const duration = planToUpdate.duration || planToUpdate.durationMonths || 1;
  const unit = planToUpdate.durationUnit || 'Months';

  const fullPlan: MembershipPlan = {
    ...planToUpdate,
    duration,
    durationMonths: unit === 'Months' ? duration : Math.max(1, Math.round(duration / 30)),
    durationUnit: unit,
    isActive: planToUpdate.isActive !== undefined ? planToUpdate.isActive : true,
  };

  const updatedPlans = (settings.plans || []).map((p) => (p.id === fullPlan.id ? fullPlan : p));
  updateSettings({ ...settings, plans: updatedPlans });
  return fullPlan;
}

/**
 * Toggle plan active/inactive status
 */
export function togglePlanStatus(planId: string): MembershipPlan | null {
  const settings = getSettings();
  const plan = (settings.plans || []).find((p) => p.id === planId);
  if (!plan) return null;

  const updatedPlan: MembershipPlan = {
    ...plan,
    isActive: !(plan.isActive !== false),
  };

  updatePlan(updatedPlan);
  return updatedPlan;
}

/**
 * Safely delete a membership plan or deactivate it
 */
export function deletePlan(planId: string): { success: boolean; message?: string } {
  const settings = getSettings();
  const filteredPlans = (settings.plans || []).filter((p) => p.id !== planId);
  updateSettings({ ...settings, plans: filteredPlans });
  return { success: true };
}

/**
 * Resets all demo data to system defaults
 */
export function resetAllData(): void {
  resetDataToDefaults();
}
