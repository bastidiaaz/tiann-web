import { describe, it, expect } from 'vitest';
import { SPOTS, PROXIMITY_ENTER, PROXIMITY_EXIT, type SpotConfig } from './spots.config';

describe('spots.config', () => {
  it('exports exactly 6 spots', () => {
    expect(SPOTS).toHaveLength(6);
  });

  it('each spot has required fields with correct types', () => {
    SPOTS.forEach((spot: SpotConfig) => {
      expect(typeof spot.id).toBe('number');
      expect(typeof spot.trackId).toBe('string');
      expect(spot.trackId.length).toBeGreaterThan(0);
      expect(spot.position).toHaveLength(3);
      spot.position.forEach((v) => expect(typeof v).toBe('number'));
      expect(spot.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('exit threshold is greater than enter threshold', () => {
    expect(PROXIMITY_EXIT).toBeGreaterThan(PROXIMITY_ENTER);
  });

  it('all spots are within 130 units of origin', () => {
    SPOTS.forEach((spot) => {
      const [x, , z] = spot.position;
      const dist = Math.sqrt(x ** 2 + z ** 2);
      expect(dist).toBeLessThanOrEqual(130);
    });
  });

  it('all spots are far enough apart to prevent simultaneous activation', () => {
    const minDist = PROXIMITY_EXIT * 2;
    for (let i = 0; i < SPOTS.length; i++) {
      for (let j = i + 1; j < SPOTS.length; j++) {
        const [x1, , z1] = SPOTS[i].position;
        const [x2, , z2] = SPOTS[j].position;
        const dist = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
        expect(dist).toBeGreaterThan(minDist);
      }
    }
  });
});
