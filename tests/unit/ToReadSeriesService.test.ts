import { BookWeightingService } from '../../src/services/ToReadSeriesService';

describe('ToReadSeriesService (BookWeightingService)', () => {
  it('should be defined and expose applyWeights', () => {
    expect(BookWeightingService).toBeDefined();
    expect(typeof BookWeightingService.applyWeights).toBe('function');
  });
});
