import { SettingsManager } from './Settings';

import '../assets/Logo.png'

export async function setup(ctx: Modding.ModContext) {
    console.log("===== Global Slayer setup entered =====");
    SettingsManager.init(ctx);
}