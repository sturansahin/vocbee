import {
  getTutorialSpotlightLayout,
  getTutorialTargetLayout,
  getTutorialTooltipPosition,
  type TutorialLayouts,
} from '../homeTutorialLayout';

const layouts: TutorialLayouts = {
  card: { x: 40, y: 220, width: 310, height: 420 },
  favoriteButton: { x: 54, y: 234, width: 44, height: 44 },
  word: { x: 120, y: 320, width: 150, height: 52 },
  exampleSentence: { x: 70, y: 500, width: 250, height: 48 },
  moreExample: { x: 40, y: 580, width: 310, height: 60 },
};

describe('homeTutorialLayout', () => {
  it.each([
    [1, 'card'],
    [2, 'card'],
    [3, 'favoriteButton'],
    [4, 'word'],
    [5, 'exampleSentence'],
    [6, 'moreExample'],
  ] as const)('maps step %s to the real %s layout', (step, key) => {
    expect(getTutorialTargetLayout(layouts, step)).toBe(layouts[key]);
  });

  it('keeps swipe motion visible by widening the card spotlight within the viewport', () => {
    expect(getTutorialSpotlightLayout(layouts, 1, 390, 844)).toEqual({
      x: 0,
      y: 200,
      width: 390,
      height: 460,
    });
    expect(getTutorialSpotlightLayout(layouts, 2, 390, 844)).toEqual({
      x: 0,
      y: 200,
      width: 390,
      height: 460,
    });
  });

  it('places tutorial copy outside the target whenever either side has room', () => {
    const above = getTutorialTooltipPosition({
      target: layouts.card,
      containerHeight: 844,
      tooltipHeight: 80,
      controlsHeight: 60,
      preferAbove: true,
    });
    expect(above.placement).toBe('above');
    expect(above.top + 80).toBeLessThan(layouts.card.y);

    const below = getTutorialTooltipPosition({
      target: layouts.word,
      containerHeight: 844,
      tooltipHeight: 80,
      controlsHeight: 60,
      preferAbove: false,
    });
    expect(below.placement).toBe('below');
    expect(below.top).toBeGreaterThan(layouts.word.y + layouts.word.height);
  });

  it('clamps the tooltip into usable screen space on short screens', () => {
    const result = getTutorialTooltipPosition({
      target: { x: 20, y: 80, width: 280, height: 320 },
      containerHeight: 480,
      tooltipHeight: 96,
      controlsHeight: 64,
      preferAbove: true,
      edgeInset: 10,
      gap: 10,
    });

    expect(result.top).toBeGreaterThanOrEqual(10);
    expect(result.top + 96).toBeLessThanOrEqual(406);
  });
});
