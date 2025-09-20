/**
 * Feature flags globais do aplicativo
 */

export const ATTACHMENTS_ENABLED = false;

/**
 * Tipo para as features flags
 */
export type FeatureFlags = {
  attachmentsEnabled: boolean;
};

/**
 * Features flags configuradas
 */
export const features: FeatureFlags = {
  attachmentsEnabled: ATTACHMENTS_ENABLED,
};