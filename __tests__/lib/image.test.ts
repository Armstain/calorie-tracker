import { calculateDownscaleSize } from '@/lib/image';

describe('calculateDownscaleSize', () => {
  it('leaves small images untouched', () => {
    expect(calculateDownscaleSize(800, 600, 1024)).toEqual({ width: 800, height: 600 });
  });

  it('shrinks the longest side to the cap, preserving aspect ratio', () => {
    expect(calculateDownscaleSize(4000, 3000, 1024)).toEqual({ width: 1024, height: 768 });
    expect(calculateDownscaleSize(2000, 4000, 1024)).toEqual({ width: 512, height: 1024 });
  });

  it('leaves an image exactly at the cap untouched', () => {
    expect(calculateDownscaleSize(1024, 768, 1024)).toEqual({ width: 1024, height: 768 });
  });
});
