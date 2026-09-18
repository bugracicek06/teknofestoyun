import Phaser from 'phaser';
import { BaseScene } from '../BaseScene';
import { SceneKeys } from '../../../types/game';
import { EventBus } from '../../state/EventBus';
import { GameStore } from '../../state/GameStore';
import { calculateResult } from '../../systems/scoring';
import { GameButton } from '../../objects/GameButton';
import { SoundFx } from '../../utils/audio';

const categories = [
  { name: 'Malzeme', values: ['Seramik', 'Ahşap', 'Dokuma'] },
  { name: 'Biçim', values: ['Yuvarlak', 'Kare', 'Altıgen'] },
  { name: 'Renk', values: ['Turkuaz', 'Toprak', 'Lacivert'] },
  { name: 'Motif', values: ['Yıldız', 'Dalga', 'Çiçek'] },
] as const;

export class CraftDesignScene extends BaseScene {
  private selections = [0, 0, 0, 0];
  private stage = 0;
  private seconds = 0;
  private stamps: Array<{x:number;y:number}> = [];
  private art!: Phaser.GameObjects.Graphics;
  private options?: Phaser.GameObjects.Container;
  private title!: Phaser.GameObjects.Text;
  private timer!: Phaser.GameObjects.Text;
  private nextButton?: GameButton;
  private chosen = false;
  constructor() { super(SceneKeys.ANADOLU_USTALIGI); }
  create(): void {
    this.selections = [0,0,0,0]; this.stage=0; this.seconds=0; this.stamps=[]; this.chosen=false;
    this.createCinematicBackground();
    this.createText(70,55,'3 · Anadolu Ustalığı – Ustalığın İzleri',{fontSize:'34px',fontStyle:'bold'});
    this.title=this.createText(960,235,'').setOrigin(.5);
    this.art=this.add.graphics();
    this.timer=this.createText(1750,55,'0 sn');
    this.time.addEvent({delay:1000,loop:true,callback:()=>{this.seconds++;this.timer.setText(`${this.seconds} sn`);}});
    const board=this.add.zone(670,570,650,580).setInteractive();
    board.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{
      if(this.stage!==4 || this.stamps.length>=6)return;
      this.stamps.push({x:Phaser.Math.Clamp(pointer.x,450,890),y:Phaser.Math.Clamp(pointer.y,370,770)});
      SoundFx.playSuccessTone();this.drawArt();this.showOptions();
    });
    this.showOptions(); this.drawArt();
    EventBus.emit('current-scene-ready',SceneKeys.ANADOLU_USTALIGI);
  }
  private showOptions():void {
    this.options?.destroy();this.options=this.add.container(0,0);this.nextButton?.destroy();
    this.title.setText(this.stage<4 ? `${this.stage+1}/5 · ${categories[this.stage].name} seç; eserin hemen değişsin.` : `5/5 · Eserin üzerine dokunarak 6 motif yerleştir. (${this.stamps.length}/6)`);
    if(this.stage<4) categories[this.stage].values.forEach((label,index)=>{
      const button=new GameButton(this,1370,390+index*145,450,105,`${this.selections[this.stage]===index?'✓ ':''}${label}`,()=>{
        this.selections[this.stage]=index;this.chosen=true;SoundFx.playSuccessTone();this.drawArt();this.showOptions();
      },this.selections[this.stage]===index?0x53dfcc:0x334b64,this.selections[this.stage]===index?'#071222':'#ffffff');this.options!.add(button);
    });
    this.nextButton=new GameButton(this,1370,890,450,108,this.stage===4?'Eserimi Tamamla':'Seçimimi Onayla →',()=>{
      if(this.stage<4){if(!this.chosen){this.title.setText('Önce bir seçeneğe dokun.');return;}this.stage++;this.chosen=false;this.showOptions();}
      else if(this.stamps.length===6){const choices=Object.fromEntries(categories.map((c,i)=>[c.name,c.values[this.selections[i]]]));GameStore.saveResult('anadolu_ustaligi',calculateResult(this.seconds,0,choices));EventBus.emit('mission-result','anadolu_ustaligi');}
      else this.title.setText('Eserine toplam 6 motif yerleştir; her desen sana ait.');
    },0xf6c76b);
  }
  private drawArt():void {
    const g=this.art;g.clear();
    const colors=[0x53dfcc,0xcf8556,0x3e65b8];
    g.fillStyle([0xe9d5af,0x976744,0xcfbdb0][this.selections[0]]);g.lineStyle(12,colors[this.selections[2]]);
    if(this.selections[1]===0){g.fillCircle(670,570,270);g.strokeCircle(670,570,270);}
    else if(this.selections[1]===1){g.fillRoundedRect(395,295,550,550,28);g.strokeRoundedRect(395,295,550,550,28);}
    else {const points=Array.from({length:6},(_,i)=>new Phaser.Math.Vector2(670+290*Math.cos(i*Math.PI/3),570+290*Math.sin(i*Math.PI/3)));g.fillPoints(points,true);g.strokePoints(points,true);}
    g.lineStyle(2,0xffffff,.2);
    if(this.selections[0]===2)for(let y=330;y<810;y+=18)g.lineBetween(470,y,870,y);
    if(this.selections[0]===1)for(let x=470;x<870;x+=25)g.lineBetween(x,350,x+12,790);
    const marks=this.stamps.length?this.stamps:[{x:670,y:570}];
    marks.forEach(({x,y})=>{
      g.fillStyle(colors[this.selections[2]]);g.lineStyle(7,colors[this.selections[2]]);
      if(this.selections[3]===0){const points=Array.from({length:16},(_,i)=>new Phaser.Math.Vector2(x+(i%2?18:44)*Math.cos(i*Math.PI/8),y+(i%2?18:44)*Math.sin(i*Math.PI/8)));g.fillPoints(points,true);}
      else if(this.selections[3]===1){g.beginPath();g.moveTo(x-44,y);for(let i=0;i<=88;i++)g.lineTo(x-44+i,y+Math.sin(i/14)*18);g.strokePath();}
      else {for(let i=0;i<6;i++)g.fillCircle(x+Math.cos(i*Math.PI/3)*24,y+Math.sin(i*Math.PI/3)*24,16);g.fillStyle(0xf6c76b);g.fillCircle(x,y,13);}
    });
  }
}

