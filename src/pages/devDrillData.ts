import { parseTiles } from '../engine/tiles'

/** /dev/drill の問題(シャンテン数が 0〜3 の手) */
export const SAMPLE_HANDS = [
  '123m456p789s1122z',
  '123456m78p23s115z',
  '12m45p789s23s1155z',
  '1122m3344p5566s7z',
  '13m469p2378s1255z',
].map((h) => parseTiles(h))
