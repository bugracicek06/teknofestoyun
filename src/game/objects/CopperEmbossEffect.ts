import Phaser from 'phaser';

export class CopperEmbossEffect {
  public static renderEmbossLine(
    scene: Phaser.Scene,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): Phaser.GameObjects.Graphics {
    const line = scene.add.graphics();
    line.lineStyle(6, 0xffd700, 1);
    line.beginPath();
    line.moveTo(startX, startY);
    line.lineTo(endX, endY);
    line.strokePath();

    // Spark Burst
    for (let i = 0; i < 8; i++) {
      const spark = scene.add.circle(endX, endY, Phaser.Math.Between(3, 6), 0xffd700);
      const angle = Math.random() * Math.PI * 2;
      const dist = Phaser.Math.Between(20, 60);

      scene.tweens.add({
        targets: spark,
        x: endX + Math.cos(angle) * dist,
        y: endY + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 300,
        onComplete: () => spark.destroy(),
      });
    }

    return line;
  }
}
