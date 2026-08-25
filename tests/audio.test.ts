import {describe,expect,it} from 'vitest';
import {AudioEngine} from '../src/audio';

describe('AudioEngine',()=>{
 it('applies live mute state to the BGM media element',()=>{
  const audio=new AudioEngine();
  const bgm={muted:false,volume:1};
  (audio as unknown as {bgm:typeof bgm}).bgm=bgm;

  audio.set(true,.5);
  expect(bgm.muted).toBe(true);
  expect(bgm.volume).toBe(0);

  audio.set(false);
  expect(bgm.muted).toBe(false);
  expect(bgm.volume).toBeCloseTo(.12);
 });
});
