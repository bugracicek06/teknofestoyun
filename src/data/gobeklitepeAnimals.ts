import foxSvg from '../assets/svg/relief_fox_left.svg';
import boarSvg from '../assets/svg/relief_boar_left.svg';
import craneSvg from '../assets/svg/relief_crane_left.svg';
import snakeSvg from '../assets/svg/relief_snake.svg';
import bullSvg from '../assets/svg/relief_bull.svg';
import scorpionSvg from '../assets/svg/relief_scorpion.svg';
import { shuffleAnimals } from '../utils/shuffle';

export interface AnimalItem {
  id: string;
  name: string;
  icon: string;
}

export const GOBEKLITEPE_ANIMALS: readonly AnimalItem[] = [
  { id: 'p_fox_left', name: 'Tilki', icon: foxSvg },
  { id: 'p_boar_left', name: 'Domuz', icon: boarSvg },
  { id: 'p_crane_left', name: 'Turna', icon: craneSvg },
  { id: 'p_fox_right', name: 'Yılan', icon: snakeSvg },
  { id: 'p_boar_right', name: 'Boğa', icon: bullSvg },
  { id: 'p_crane_right', name: 'Akrep', icon: scorpionSvg },
] as const;

export { shuffleAnimals };
