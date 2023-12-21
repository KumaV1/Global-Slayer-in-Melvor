import { Constants } from "./Constants";

export class SettingsManager {
    public static init(ctx: Modding.ModContext): void {
        // Create settings
        ctx.settings.section(getLangString(`${Constants.MOD_NAMESPACE}_Settings_Section_Enable`)).add([
            {
                type: 'label',
                name: 'info',
                label: getLangString(`${Constants.MOD_NAMESPACE}_Settings_Setting_Label_Info`),
            } as Modding.Settings.SettingConfig,
            {
                type: 'checkbox-group',
                name: 'force-all-non-bosses-of-area-types-slayerable',
                label: getLangString(`${Constants.MOD_NAMESPACE}_Settings_Setting_Label_Force_All_Non_Bosses_Of_Area_Type_Slayerable`),
                hint: getLangString(`${Constants.MOD_NAMESPACE}_Settings_Setting_Hint_Force_All_Non_Bosses_Of_Area_Type_Slayerable`),
                options: [
                    {
                        value: CombatAreaType.Combat,
                        label: getLangString('GAME_GUIDE_COMBAT_COMBAT_AREAS')
                    },
                    {
                        value: CombatAreaType.Slayer,
                        label: getLangString('GAME_GUIDE_COMBAT_SLAYER_AREAS')
                    },
                    {
                        value: CombatAreaType.Dungeon,
                        label: getLangString('GAME_GUIDE_COMBAT_DUNGEONS')
                    }
                ],
                onChange(value: string, previousValue: string): void {
                    SettingsManager.setButtonToReload();

                    const hint = document.querySelector(`label[for="${Constants.MOD_NAMESPACE}:force-all-non-bosses-of-area-types-slayerable"] > small`);
                    if (hint) {
                        hint.textContent = getLangString(`${Constants.MOD_NAMESPACE}_Settings_Hint_Save_Reload_Required`);
                        hint.classList.add("text-warning");
                    }
                }
            } as Modding.Settings.CheckboxGroupConfig,
            {
                type: 'checkbox-group',
                name: 'force-all-bosses-of-area-types-slayerable',
                label: getLangString(`${Constants.MOD_NAMESPACE}_Settings_Setting_Label_Force_All_Bosses_Of_Area_Type_Slayerable`),
                hint: getLangString(`${Constants.MOD_NAMESPACE}_Settings_Setting_Hint_Force_All_Bosses_Of_Area_Type_Slayerable`),
                options: [
                    {
                        value: CombatAreaType.Combat,
                        label: getLangString('GAME_GUIDE_COMBAT_COMBAT_AREAS')
                    },
                    {
                        value: CombatAreaType.Slayer,
                        label: getLangString('GAME_GUIDE_COMBAT_SLAYER_AREAS')
                    },
                    {
                        value: CombatAreaType.Dungeon,
                        label: getLangString('GAME_GUIDE_COMBAT_DUNGEONS')
                    }
                ],
                onChange(value: string, previousValue: string): void {
                    SettingsManager.setButtonToReload();

                    const hint = document.querySelector(`label[for="${Constants.MOD_NAMESPACE}:force-all-bosses-of-area-types-slayerable"] > small`);
                    if (hint) {
                        hint.textContent = getLangString(`${Constants.MOD_NAMESPACE}_Settings_Hint_Save_Reload_Required`);
                        hint.classList.add("text-warning");
                    }
                }
            } as Modding.Settings.CheckboxGroupConfig,
            {
                type: "button",
                name: "save-reload",
                display: getLangString(`${Constants.MOD_NAMESPACE}_Settings_Setting_Display_Save_Reload`),
                color: "primary",
                onClick: () => {
                    saveData();
                    window.location.reload();
                }
            } as Modding.Settings.ButtonConfig
        ]);

        // On character load, use settings to enable relevant monsters as slayer task targets
        ctx.onCharacterLoaded(function () {
            console.log("RUNNING onCharacterLoaded");

            // Get settings
            const areasForcingAllNonBosses = SettingsManager.getForceAllNonBossesOfAreaTypesValid(ctx);
            const areasForcingAllBosses = SettingsManager.getForceAllBossesOfAreaTypesValid(ctx);

            // Determine wishes as booleans
            const forceAllCaNonBossesSlayerable: boolean = areasForcingAllNonBosses.some(a => a === CombatAreaType.Combat);
            const forceAllSaNonBossesSlayerable: boolean = areasForcingAllNonBosses.some(a => a === CombatAreaType.Slayer);
            const forceAllDBNonossesSlayerable: boolean = areasForcingAllNonBosses.some(a => a === CombatAreaType.Dungeon);
            const forceAllCaBossesSlayerable: boolean = areasForcingAllBosses.some(a => a === CombatAreaType.Combat);
            const forceAllSaBossesSlayerable: boolean = areasForcingAllBosses.some(a => a === CombatAreaType.Slayer);
            const forceAllDBossesSlayerable: boolean = areasForcingAllBosses.some(a => a === CombatAreaType.Dungeon);

            // Change monsters
            if (forceAllCaNonBossesSlayerable || forceAllCaBossesSlayerable) {
                game.combatAreas.forEach((area) => {
                    area.monsters.forEach((monster) => {
                        if ((!monster.isBoss && forceAllCaNonBossesSlayerable) ||
                            (monster.isBoss && forceAllCaBossesSlayerable)) {
                            monster.canSlayer = true;
                        }
                    });
                });
            }

            // Slayer Areas
            if (forceAllSaNonBossesSlayerable || forceAllSaBossesSlayerable) {
                game.slayerAreas.forEach((area) => {
                    area.monsters.forEach((monster) => {
                        if ((!monster.isBoss && forceAllSaNonBossesSlayerable) ||
                            (monster.isBoss && forceAllSaBossesSlayerable)) {
                            monster.canSlayer = true;
                        }
                    });
                });
            }

            // Dungeons
            const filteredDungeons = game.dungeons.filter(d => !Constants.NEVER_CHECK_DUNGEONS.some(cd => cd === d.id));
            if (forceAllDBNonossesSlayerable || forceAllDBossesSlayerable) {
                filteredDungeons.forEach((area) => {
                    area.monsters.forEach((monster) => {
                        // Boss
                        if (monster.isBoss && forceAllDBossesSlayerable) {
                            monster.canSlayer = true;
                        }

                        // Non boss
                        if (!monster.isBoss && forceAllDBNonossesSlayerable &&
                            !Constants.NEVER_CHECK_NON_BOSSES_IN_DUNGEONS.some(d => d === area.id)) {
                            monster.canSlayer = true;
                        }
                    });
                });
            }
        });
    }

    /**
     * Patches certain methods, mainly so dungeons actually work with slayer
     */
    public static patchMethods(ctx: Modding.ModContext): void {
        /**
         * Patch on enemy death for when inside a dungeon,
         * so you actually get xp/coins/task progress during kills occurring in the dungeon
         */
        ctx.patch(CombatManager, "onEnemyDeath").after(function () {
            if (this.selectedArea instanceof Dungeon) {
                if (this.onSlayerTask) {
                    this.slayerTask.addKill();
                    this.player.rewardSlayerCoins();
                    const chanceForDoubleReward = this.player.modifiers.increasedChanceDoubleSlayerTaskKill - this.player.modifiers.decreasedChanceDoubleSlayerTaskKill;
                    if (rollPercentage(chanceForDoubleReward) && this.onSlayerTask) {
                        this.slayerTask.addKill();
                        this.player.rewardSlayerCoins();
                    }
                    let slayerXPReward = this.enemy.stats.maxHitpoints / numberMultiplier;
                    if (slayerXPReward > 0) {
                        this.game.slayer.addXP(slayerXPReward);
                    }
                }
            }
        });

        /** Update getter for whether you are on a slayer task, as the original function specifically excludes anything inside a dungeon*/
        // @ts-ignore for some reason, Typesript doesn't pick up this function as getter. The patch seems to work as expected, though
        ctx.patch(CombatManager, 'onSlayerTask').get(function (original) {
            return original() ||
                // @ts-ignore for some reason, Typesript doesn't pick up this function as getter. The patch seems to work as expected, though
                (this.areaType === CombatAreaType.Dungeon &&
                    // @ts-ignore for some reason, Typesript doesn't pick up this function as getter. The patch seems to work as expected, though
                    this.slayerTask.active &&
                    // @ts-ignore for some reason, Typesript doesn't pick up this function as getter. The patch seems to work as expected, though
                    this.slayerTask.monster === this.enemy?.monster
                );
        });

        /**
         * Patch monster selection, so that dungeon monster selection "falling on its nose"
         * will instead forward to selecting a dungeon, if possible
         */
        ctx.patch(CombatManager, 'selectMonster').after(function (returnValue: void, monster: Monster, area: CombatArea | SlayerArea) {
            // If the method found a valid combat/slayer area for the given monster, then there is no need for custom logic
            if (this.selectedArea !== undefined) {
                return;
            }

            // Otherwise, check if the monster can be found in any of the dungeons, and if so select said dungeon,
            // NOTE: This code is expected to only be relevant on slayer task jump to a dungeon-only monster,
            // therefore the slayer task selection should have already taken care of the access requirements
            // Even so, we make sure to check whether we actually successfully changed the selected area, before breaking out of the loop
            for (let dungeon of game.dungeons.allObjects) {
                if (dungeon.monsters.some(m => m.id === monster.id)) {
                    this.selectDungeon(dungeon);
                    if (this.selectedArea === dungeon) {
                        break; // break out of loop, as we were able to change selected area
                    }
                }
            }
        });
    }

    /**
     *
     */
    public static getForceAllNonBossesOfAreaTypesValid(ctx: Modding.ModContext): CombatAreaType[] {
        return ctx.settings
            .section(getLangString(`${Constants.MOD_NAMESPACE}_Settings_Section_Enable`))
            .get('force-all-non-bosses-of-area-types-slayerable') as CombatAreaType[] ?? [];
    }

    /**
     *
     */
    public static getForceAllBossesOfAreaTypesValid(ctx: Modding.ModContext): CombatAreaType[] {
        return ctx.settings
            .section(getLangString(`${Constants.MOD_NAMESPACE}_Settings_Section_Enable`))
            .get('force-all-bosses-of-area-types-slayerable') as CombatAreaType[] ?? [];
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