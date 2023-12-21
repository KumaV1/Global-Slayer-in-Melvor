import { SettingsManager } from './SettingsManager';
import { TranslationManager } from './translation/TranslationManager';

import '../assets/Logo.png'

export async function setup(ctx: Modding.ModContext) {
    initTranslation();
    initSettings(ctx);
}

/**
 * Patches multiple name/description getters, so they check our custom injected translations
 * Also creates a list of translations for the current languages and registers it
 * @param ctx
 */
function initTranslation() {
    TranslationManager.register();
}

/**
 *
 * @param ctx
 */
function initSettings(ctx: Modding.ModContext) {
    SettingsManager.init(ctx);
}