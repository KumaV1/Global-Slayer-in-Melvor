import { Constants } from "./Constants";

export class SettingsManager {
    public static init(ctx: Modding.ModContext): void {
        // Create settings
        ctx.settings.section("Enable all").add([
            {
                type: 'label',
                name: 'info',
                label: "Regarding dungeons, if a monster can be found outside a dungeon, then jumping to the monster will enter the corresponding combat/slayer area. On the other hand, if the monster can only be found in a dungeon, then jumping to that monster will start the dungeon, rather than fighting the monster directly. Do note, that if a monster can be found in more than one dungeon, then the first one found will be selected (should usually be the one with lowest combat stats)."
            } as Modding.Settings.SettingConfig,
            {
                type: 'checkbox-group',
                name: 'force-all-non-bosses-of-area-types-valid',
                label: "Force all monsters not categorized as boss to be viable slayer tasks",
                hint: 'Usually already the case for slayer areas. As for dungeons, "Into the Mist", "Impending Darkeness" and "Lair of the Spider Queen" cannot be rolled for. Also, please be aware, that finishing a dungeon-monster task with auto slayer on will instantly take you out of the dungeon, without finishing the dungeon first (even if the next task is a monster only found in the same dungeon you were just fighting in).',
                options: [
                    {
                        value: CombatAreaType.Combat,
                        label: "Combat Areas"
                    },
                    {
                        value: CombatAreaType.Slayer,
                        label: "Slayer Areas"
                    },
                    {
                        value: CombatAreaType.Dungeon,
                        label: "Dungeons"
                    }
                ],
                onChange(value: string, previousValue: string): void {
                    SettingsManager.setButtonToReload();

                    const hint = document.querySelector(`label[for="${Constants.MOD_NAMESPACE}:force-all-non-bosses-of-area-types-valid"] > small`);
                    if (hint) {
                        hint.textContent = "Reload required";
                        hint.classList.add("text-warning");
                    }
                }
            } as Modding.Settings.CheckboxGroupConfig,
            {
                type: 'checkbox-group',
                name: 'force-all-bosses-of-area-types-valid',
                label: "Force all monsters categorized as boss to be viable slayer tasks",
                hint: 'Usually, only the final monster in dungeons is categorized as a boss. There may be exceptions to this rule, though, especially with modding, so you can configure this for every area type. Regarding dungeons, "Into the Mist" and "Impending Darkeness" cannot be rolled for.',
                options: [
                    {
                        value: CombatAreaType.Combat,
                        label: "Combat Areas"
                    },
                    {
                        value: CombatAreaType.Slayer,
                        label: "Slayer Areas"
                    },
                    {
                        value: CombatAreaType.Dungeon,
                        label: "Dungeons"
                    }
                ],
                onChange(value: string, previousValue: string): void {
                    SettingsManager.setButtonToReload();

                    const hint = document.querySelector(`label[for="${Constants.MOD_NAMESPACE}:force-all-bosses-of-area-types-valid"] > small`);
                    if (hint) {
                        hint.textContent = "Reload required";
                        hint.classList.add("text-warning");
                    }
                }
            } as Modding.Settings.CheckboxGroupConfig,
            {
                type: "button",
                name: "save-reload",
                display: "Save & Reload",
                color: "primary",
                onClick: () => {
                    saveData();
                    window.location.reload();
                }
            } as Modding.Settings.ButtonConfig
        ]);

        // On character load, use settings to enable relevant monsters as slayer task targets
        ctx.onCharacterLoaded(function () {
            // Get settings
            const areasForcingAllNonBosses = SettingsManager.getForceAllNonBossesOfAreaTypesValid(ctx);
            const areasForcingAllBosses = SettingsManager.getForceAllBossesOfAreaTypesValid(ctx);

            // Determine wishes as booleans
            const forceAllCaNonBossesSlayerable = areasForcingAllNonBosses.some(a => a === CombatAreaType.Combat);
            const forceAllSaNonBossesSlayerable = areasForcingAllNonBosses.some(a => a === CombatAreaType.Slayer);
            const forceAllDBNonossesSlayerable = areasForcingAllNonBosses.some(a => a === CombatAreaType.Dungeon);
            const forceAllCaBossesSlayerable = areasForcingAllBosses.some(a => a === CombatAreaType.Combat);
            const forceAllSaBossesSlayerable = areasForcingAllBosses.some(a => a === CombatAreaType.Slayer);
            const forceAllDBossesSlayerable = areasForcingAllBosses.some(a => a === CombatAreaType.Dungeon);

            // Change monsters
            ctx.onCharacterLoaded(() => {

            });
        });
    }

    /**
     *
     */
    public static getForceAllNonBossesOfAreaTypesValid(ctx: Modding.ModContext): CombatAreaType[] {
        return ctx.settings
            .section("Enable all")
            .get('keep-specific-monster-types-inactive') as CombatAreaType[] ?? [];
    }

    /**
     *
     */
    public static getForceAllBossesOfAreaTypesValid(ctx: Modding.ModContext): CombatAreaType[] {
        return ctx.settings
            .section("Enable all")
            .get('keep-specific-monster-types-inactive') as CombatAreaType[] ?? [];
    }

    /**
     * Change color of save button from primary to danger
     */
    private static setButtonToReload(): void {
        const btn = document.getElementById(`${Constants.MOD_NAMESPACE}:save-reload`);
        if (btn && btn.classList.contains("btn-primary")) {
            btn.classList.replace("btn-primary", "btn-danger");
        }
    }
}