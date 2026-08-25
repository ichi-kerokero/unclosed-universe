import {describe,expect,it} from 'vitest';
import {openingFrame,PLAY_READY_AT,TITLE_VISIBLE_AT} from '../src/opening';

describe('opening timeline',()=>{
 it('keeps interaction locked until the initial universe is visible',()=>{
  expect(openingFrame(PLAY_READY_AT-1).playReady).toBe(false);
  expect(openingFrame(PLAY_READY_AT).playReady).toBe(true);
  expect(openingFrame(PLAY_READY_AT).initialUniverseOpacity).toBe(1);
 });

 it('holds readable credits, then fades them before play',()=>{
  expect(openingFrame(2500).creditsOpacity).toBe(1);
  expect(openingFrame(5800).creditsOpacity).toBe(1);
  expect(openingFrame(7600).creditsOpacity).toBe(0);
 });

 it('keeps the floating Hat and reveals the title without a page change',()=>{
  expect(openingFrame(1800).floatingHatOpacity).toBe(0);
  expect(openingFrame(2500).floatingHatOpacity).toBe(1);
  expect(openingFrame(PLAY_READY_AT).titleOpacity).toBe(0);
  expect(openingFrame(TITLE_VISIBLE_AT).titleOpacity).toBe(1);
 });
});
