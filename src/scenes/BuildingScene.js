import BaseInteriorScene from './BaseInteriorScene.js';

export default class BuildingScene extends BaseInteriorScene {
  constructor() {
    super('BuildingScene', 'build_bg', 'build_collision');
  }
}
