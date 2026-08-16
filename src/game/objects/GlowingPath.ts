import Phaser from 'phaser';

export class GlowingPath {
  private graphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, points: Phaser.Math.Vector2[]) {
    this.graphics = scene.add.graphics();

    if (points.length < 2) return;

    const curve = new Phaser.Curves.Spline(points);

    // Outer Deep Cyan Glow
    this.graphics.lineStyle(16, 0x00f2fe, 0.25);
    curve.draw(this.graphics, 120);

    // Mid Gold/Turquoise Line
    this.graphics.lineStyle(8, 0xffd700, 0.6);
    curve.draw(this.graphics, 120);

    // Core White Beam
    this.graphics.lineStyle(3, 0xffffff, 0.9);
    curve.draw(this.graphics, 120);

    // Flowing energy particle dots along curve
    const pathPoints = curve.getSpacedPoints(40);
    pathPoints.forEach((pt, i) => {
      const dot = scene.add.circle(pt.x, pt.y, 4, 0x00f2fe, 0.8);
      scene.tweens.add({
        targets: dot,
        scale: 1.8,
        alpha: 0.3,
        duration: 800 + (i % 5) * 200,
        yoyo: true,
        repeat: -1,
        delay: i * 80,
      });
    });
  }
}
