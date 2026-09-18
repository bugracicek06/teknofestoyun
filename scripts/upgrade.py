from pathlib import Path
root = Path(__file__).resolve().parent.parent
def edit(name, fn):
 p=root/name; p.write_text(fn(p.read_text(encoding='utf-8')),encoding='utf-8')

edit('src/game/state/GameStore.ts', lambda s:s.replace("import { EventBus }", "import type { MissionResult } from '../systems/scoring';\nimport { EventBus }").replace("  isAudioMuted: boolean;", "  isAudioMuted: boolean;\n  results: Record<string, MissionResult>;").replace("unlockedModuleIds: ['gobeklitepe', 'demir_cagi']", "unlockedModuleIds: ['gobeklitepe']").replace("isAudioMuted: false,", "isAudioMuted: false,\n    results: {},").replace("    this.restore();", "    this.restore();\n    this.resetProgress();").replace("      ...this.state,", "      ...this.state,\n      results: structuredClone(this.state.results),").replace("  public completeModule(moduleId: string): void {", "  public saveResult(moduleId: string, result: MissionResult): void {\n    this.state.results[moduleId] = structuredClone(result);\n    this.completeModule(moduleId);\n    this.persistAndNotify();\n  }\n\n  public completeModule(moduleId: string): void {").replace("    if (!this.state.completedModuleIds.includes(normalizedId)) {", "    if (!this.moduleOrder.includes(normalizedId) || !this.isModuleUnlocked(normalizedId)) return;\n    if (!this.state.completedModuleIds.includes(normalizedId)) {").replace("    this.state.currentModuleId = moduleId;", "    if (!this.isModuleUnlocked(moduleId)) return;\n    this.state.currentModuleId = moduleId;").replace("    this.state.completedModuleIds = [];", "    this.state.completedModuleIds = [];\n    this.state.results = {};").replace("JSON.stringify(this.state)", "JSON.stringify({ isAudioMuted: this.state.isAudioMuted })").replace("        isAudioMuted: savedState.isAudioMuted === true,", "        isAudioMuted: savedState.isAudioMuted === true,\n        results: {},"))
edit('src/game/utils/audio.ts', lambda s:s.replace("if (!this.ctx) return;", "if (!this.ctx || GameStore.getState().isAudioMuted) return;"))
edit('index.html', lambda s:'\n'.join(l for l in s.splitlines() if 'fonts.google' not in l))
titles=['Göbeklitepe – Taşın Hafızası','Demir Çağı – Ateşe Hükmet','Anadolu Ustalığı – Ustalığın İzleri','Mühendislik – Mekanizmayı Kur','Millî Teknoloji – Gökyüzüne Yüksel','Uzay Teknolojileri – Sıra Sende']
old=['Göbeklitepe','Demir Çağı','Anadolu Ustalığı','Bilim ve Sanayileşme','Millî Teknoloji','Uzay Teknolojileri']
def modules(s):
 for a,b in zip(old,titles): s=s.replace("title: '"+a+"'", "title: '"+b+"'")
 return s.replace('İlk tapınak yapıları, taş işçiliği ve insanlığın mimari ile ilk büyük buluşması.','Hayvan motiflerini taşlara yerleştir; ayrıntıları keşfet.').replace('Yerli Mühendislik & İHA/SİHA Çağı','Sivil Havacılık ve Toplumsal Fayda').replace('Yüksek teknoloji, havacılık, savunma ve yerli mühendislik hamlesi.','Afet gözlemi, yangın tespiti ve tarım için güvenli uçuş.')
edit('src/data/modules.ts', modules)
# Keep asset preloading, replace obsolete canvas menu with accessible HTML menu.
edit('src/game/scenes/StartScene.ts', lambda s:s[:s.index('  create(): void {')]+'''  create(): void {
    this.add.rectangle(960, 540, 1920, 1080, 0x070b19);
    EventBus.emit('current-scene-ready', SceneKeys.START);
  }
}
''')
edit('src/game/scenes/StartScene.ts', lambda s:s.replace("import Phaser from 'phaser';\n",'').replace("import { SoundFx } from '../utils/audio';\n",'').replace('  private bgImage?: Phaser.GameObjects.Image;\n  private fsBtnText?: Phaser.GameObjects.Text;\n',''))
edit('src/game/scenes/WorldMapScene.ts',lambda s:'''import { BaseScene } from './BaseScene';
import { SceneKeys } from '../../types/game';
import { EventBus } from '../state/EventBus';

export class WorldMapScene extends BaseScene {
  constructor() { super(SceneKeys.WORLD_MAP); }
  create(): void {
    this.add.rectangle(960, 540, 1920, 1080, 0x070b19);
    EventBus.emit('current-scene-ready', SceneKeys.WORLD_MAP);
  }
}
''')
edit('src/game/scenes/BaseScene.ts',lambda s:s.replace("import Phaser from 'phaser';", "import Phaser from 'phaser';\nimport { THEME } from '../systems/theme';").replace('protected readonly SYSTEM_FONT = "\'Outfit\', \'Rajdhani\', system-ui, -apple-system, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif";', 'protected readonly SYSTEM_FONT = THEME.font;'))
for p in (root/'src/game/scenes/modules').glob('*.ts'):
 s=p.read_text(encoding='utf-8')
 s=s.replace("private ANCIENT_FONT = '\"Cinzel\", \"Trajan Pro\", \"Times New Roman\", \"Georgia\", serif';",'private ANCIENT_FONT = this.SYSTEM_FONT;')
 p.write_text(s,encoding='utf-8')

# Swap repeated victory views for shared result UI, preserving the gameplay.
def replace_method(s,name,body):
 start=s.index('  private '+name+'('); opening=s.index('{',start); depth=1; end=opening+1
 while depth:
  if s[end]=='{': depth+=1
  if s[end]=='}': depth-=1
  end+=1
 return s[:start]+'  private '+name+'(): void {\n'+body+'\n  }'+s[end:]
configs=[('GobeklitepeScene','createMonumentalSteleVictoryModal','gobeklitepe','errorCount'),('DemirCagiScene','createMonumentalSteleVictoryModal','demir_cagi','totalErrors'),('SanayilesmeScene','createEngineeringVictoryModal','sanayilesme','errorCount'),('MilliTeknolojiScene','createCommandCenterVictoryModal','milli_teknoloji','errorCount')]
for file,method,mid,errors in configs:
 def update(s):
  s="import { calculateResult } from '../../systems/scoring';\n"+s
  body=f"    const result = calculateResult(this.elapsedSeconds, this.{errors});\n    GameStore.saveResult('{mid}', result);\n    EventBus.emit('mission-result', '{mid}');"
  return replace_method(s,method,body)
 edit('src/game/scenes/modules/'+file+'.ts',update)
edit('src/game/scenes/modules/GobeklitepeScene.ts',lambda s:s.replace("  private ANCIENT_FONT = this.SYSTEM_FONT;\n",'').replace("'Hoş geldin genç kâşif! Sütunların üzerindeki 6 kadim hayvan kabartmasını orijinal yuvalarına kazıyalım.'", "'Önce bir hayvana, sonra taş üzerindeki yerine dokun.'").replace('Harika bir keski darbesi! Tilki motifi kurnazlık ve çevikliği simgeler.','Taşlarda hayvan betimlemeleri bulunur; anlamları kesin bilinmiyor.').replace('Turna kuşları gökyüzü ile yeryüzü arasındaki kadim bağı temsil eder.','Kuşların uzun bacaklarına ve gagalarına dikkat et.').replace("    this.errorCount++;", "    this.errorCount++;\n    this.pusula?.setMessage('Hayvanın biçimine ve yönüne bak; tekrar dene.');"))
edit('src/game/scenes/modules/GobeklitepeScene.ts',lambda s:s.replace("      const matchingPiece = this.draggableStones.find((p) => p.config.targetZoneId === zone.config.id && !p.isPlaced);\n      if (matchingPiece && matchingPiece.active) {\n        matchingPiece.snapToZone(zone, (p, z) => this.handleCorrectPlacement(p, z));\n      }", "      this.pusula?.setMessage('Önce tepsiden bir hayvan seç.');"))
edit('src/game/scenes/modules/AnadoluUstaligiScene.ts', lambda s:s.replace("import { VictoryModal } from '../../objects/VictoryModal';", "import { calculateResult } from '../../systems/scoring';").replace('VictoryModal.calculateStats(this.elapsedSeconds, this.totalErrors)','calculateResult(this.elapsedSeconds, this.totalErrors)').replace("      new VictoryModal(this, stats, () => {", "      GameStore.saveResult('anadolu_ustaligi', stats);\n      EventBus.emit('mission-result', 'anadolu_ustaligi');\n      /* Legacy return handled by the shared accessible result panel. */\n      (() => {").replace("      });\n    });\n  }\n", "      });\n    });\n  }\n"))
edit('src/game/scenes/modules/UzayTeknolojileriScene.ts', lambda s:replace_method("import { calculateResult } from '../../systems/scoring';\n"+s,'showFinalCertificateScreen',"""    this.timerEvent?.remove();
    const selections = [this.selectedHull, this.selectedEnergy, this.selectedSensor, this.selectedLivery];
    const choices = Object.fromEntries(this.CATEGORIES.map((category, i) => [category.name, category.options.find(o => o.id === selections[i])?.name || selections[i]]));
    GameStore.saveResult('uzay_teknolojileri', calculateResult(this.elapsedSeconds, 0, choices));
    EventBus.emit('mission-result', 'uzay_teknolojileri');"""))
