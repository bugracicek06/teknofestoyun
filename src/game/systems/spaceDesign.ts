export function validateSpaceDesign(mission: string, hull: string, energy: string, sensor: string): string | null {
  if (mission === 'deep_space' && hull !== 'probe') return 'Uzak keşif için sonda gövdesini seç.';
  if (mission === 'deep_space' && energy !== 'fusion') return 'Güneşten uzak görev için radyoizotop güç kaynağını dene.';
  if (mission === 'mapping' && sensor !== 'lidar') return 'Yüzey haritası için Lidar sensörünü seç.';
  if (mission === 'surface' && hull !== 'rover') return 'Yüzeyde ilerlemek için gezgin gövdesini seç.';
  return null;
}
