import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateSpaceDesign} from '../src/game/systems/spaceDesign.ts';
test('space missions require compatible designs and offer a concrete hint',()=>{
  assert.match(validateSpaceDesign('deep_space','shuttle','solar','telescope'),/sonda/);
  assert.match(validateSpaceDesign('deep_space','probe','solar','telescope'),/güç kaynağı/);
  assert.equal(validateSpaceDesign('deep_space','probe','fusion','telescope'),null);
  assert.match(validateSpaceDesign('mapping','probe','solar','telescope'),/Lidar/);
  assert.equal(validateSpaceDesign('mapping','probe','solar','lidar'),null);
  assert.match(validateSpaceDesign('surface','probe','solar','lidar'),/gezgin/);
});
