import { BaseScene } from './BaseScene';
import { SceneKeys } from '../../types/game';
import { EventBus } from '../state/EventBus';
import { developmentPreview } from '../systems/developmentPreview';

// Safe TypeScript Asset Imports for Vite production bundler
import pauLogoUrl from '../../assets/logos/pau_logo.png';
import teknokentLogoUrl from '../../assets/logos/teknokent_logo.png';
import teknofestLogoUrl from '../../assets/logos/teknofest_logo.png';

import pusulaMascotUrl from '../../assets/svg/pusula_mascot.svg';
import islandGobeklitepeUrl from '../../assets/svg/island_gobeklitepe.svg';
import islandDemirCagiUrl from '../../assets/svg/island_demir_cagi.svg';
import islandAnadoluUrl from '../../assets/svg/island_anadolu.svg';
import islandSerinhisarUrl from '../../assets/svg/island_serinhisar.svg';
import islandMilliTeknoUrl from '../../assets/svg/island_milli_tekno.svg';
import islandUzayUrl from '../../assets/svg/island_uzay.svg';
import passportStampUrl from '../../assets/svg/passport_stamp.svg';

// Preload Göbeklitepe assets
import gobeklitepeBgUrl from '../../assets/gobeklitepe_bg.webp';
import reliefFoxLeftUrl from '../../assets/svg/relief_fox_left.svg';
import reliefBoarLeftUrl from '../../assets/svg/relief_boar_left.svg';
import reliefCraneLeftUrl from '../../assets/svg/relief_crane_left.svg';
import reliefFoxRightUrl from '../../assets/svg/relief_snake.svg';
import reliefBoarRightUrl from '../../assets/svg/relief_bull.svg';
import reliefCraneRightUrl from '../../assets/svg/relief_scorpion.svg';

import socketFoxLeftUrl from '../../assets/svg/socket_fox_left.svg';
import socketBoarLeftUrl from '../../assets/svg/socket_boar_left.svg';
import socketCraneLeftUrl from '../../assets/svg/socket_crane_left.svg';
import socketFoxRightUrl from '../../assets/svg/relief_snake.svg';
import socketBoarRightUrl from '../../assets/svg/relief_bull.svg';
import socketCraneRightUrl from '../../assets/svg/relief_scorpion.svg';

// Preload Landing Hero & World Map Background Images
import landingHeroBgUrl from '../../assets/landing_hero_bg.webp';
import worldMapBgUrl from '../../assets/world_map_bg.webp';

// Preload Demir Çağı / Serinhisar 4-Stage Cinematic assets early
import ironStage1BgUrl from '../../assets/iron_stage1_furnace.webp';
import ironStage2BgUrl from '../../assets/iron_stage2_anvil.webp';
import ironStage3BgUrl from '../../assets/iron_stage3_quench.webp';
import ironStage4BgUrl from '../../assets/iron_stage4_showcase.webp';

import oreIronRedUrl from '../../assets/svg/ore_iron_red.svg';
import oreCharcoalUrl from '../../assets/svg/ore_charcoal.svg';
import serinhisarHotRodUrl from '../../assets/svg/serinhisar_hot_rod.svg';
import serinhisarBladeForgingUrl from '../../assets/svg/serinhisar_blade_forging.svg';
import serinhisarBladeHotUrl from '../../assets/svg/serinhisar_blade_hot.svg';
import serinhisarBladeSteelUrl from '../../assets/svg/serinhisar_blade_steel.svg';
import serinhisarSheathUrl from '../../assets/svg/serinhisar_sheath.svg';
import smithHammerUrl from '../../assets/svg/smith_hammer.svg';

export class StartScene extends BaseScene {

  constructor() {
    super(SceneKeys.START);
  }

  preload(): void {
    // 1. Landing Hero & World Map Backgrounds
    if (!this.textures.exists('landing_hero_bg')) {
      this.load.image('landing_hero_bg', landingHeroBgUrl);
      this.load.image('world_map_bg', worldMapBgUrl);
    }

    // 2. Corporate Logos
    if (!this.textures.exists('pau_logo')) {
      this.load.image('pau_logo', pauLogoUrl);
      this.load.image('teknokent_logo', teknokentLogoUrl);
      this.load.image('teknofest_logo', teknofestLogoUrl);
    }

    // 3. World Map & Navigation SVG assets
    if (!this.textures.exists('pusula_mascot')) {
      this.load.image('pusula_mascot', pusulaMascotUrl);
      this.load.image('island_gobeklitepe', islandGobeklitepeUrl);
      this.load.image('island_demir_cagi', islandDemirCagiUrl);
      this.load.image('island_anadolu', islandAnadoluUrl);
      this.load.image('island_serinhisar', islandSerinhisarUrl);
      this.load.image('island_milli_tekno', islandMilliTeknoUrl);
      this.load.image('island_uzay', islandUzayUrl);
      this.load.image('passport_stamp', passportStampUrl);
    }

    // 4. Preload Göbeklitepe assets
    if (!this.textures.exists('gobeklitepe_bg')) {
      this.load.image('gobeklitepe_bg', gobeklitepeBgUrl);
    }
    if (!this.textures.exists('relief_fox_left')) {
      this.load.image('relief_fox_left', reliefFoxLeftUrl);
      this.load.image('relief_boar_left', reliefBoarLeftUrl);
      this.load.image('relief_crane_left', reliefCraneLeftUrl);
      this.load.image('relief_fox_right', reliefFoxRightUrl);
      this.load.image('relief_boar_right', reliefBoarRightUrl);
      this.load.image('relief_crane_right', reliefCraneRightUrl);
    }
    if (!this.textures.exists('socket_fox_left')) {
      this.load.image('socket_fox_left', socketFoxLeftUrl);
      this.load.image('socket_boar_left', socketBoarLeftUrl);
      this.load.image('socket_crane_left', socketCraneLeftUrl);
      this.load.image('socket_fox_right', socketFoxRightUrl);
      this.load.image('socket_boar_right', socketBoarRightUrl);
      this.load.image('socket_crane_right', socketCraneRightUrl);
    }

    // 5. Preload Demir Çağı / Serinhisar assets
    if (!this.textures.exists('iron_stage1_furnace')) {
      this.load.image('iron_stage1_furnace', ironStage1BgUrl);
      this.load.image('iron_stage2_anvil', ironStage2BgUrl);
      this.load.image('iron_stage3_quench', ironStage3BgUrl);
      this.load.image('iron_stage4_showcase', ironStage4BgUrl);

      this.load.image('ore_iron_red', oreIronRedUrl);
      this.load.image('ore_charcoal', oreCharcoalUrl);
      this.load.image('serinhisar_hot_rod', serinhisarHotRodUrl);
      this.load.image('serinhisar_blade_forging', serinhisarBladeForgingUrl);
      this.load.image('serinhisar_blade_hot', serinhisarBladeHotUrl);
      this.load.image('serinhisar_blade_steel', serinhisarBladeSteelUrl);
      this.load.image('serinhisar_sheath', serinhisarSheathUrl);
      this.load.image('smith_hammer', smithHammerUrl);
    }
  }

  create(): void {
    const preview = developmentPreview();
    if (preview) { this.scene.start(preview); return; }
    this.add.rectangle(960, 540, 1920, 1080, 0x070b19);
    EventBus.emit('current-scene-ready', SceneKeys.START);
  }
}
