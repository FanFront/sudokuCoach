import { gridFormats } from './grid.js';
import { analyzeMini, miniCandidates } from './mini.js';
import { miniTechniques } from './mini-techniques.js';
import { miniPuzzles } from '../data/mini-puzzles.js';

export const miniLessonId = (size, technique) => `mini-${size}-${technique}`;

export function miniLessonExamples(size, technique) {
  const grid = gridFormats[size];
  return miniPuzzles[size][technique].map(puzzle => {
    if (size === 4) {
      const candidates = miniCandidates(puzzle);
      return {...miniTechniques[technique](candidates,grid),board:puzzle,candidates,puzzle,stepIndex:-1};
    }
    const result = analyzeMini(puzzle,grid);
    const stepIndex = result.steps.findIndex(step=>step.technique===technique);
    return {...result.steps[stepIndex],puzzle,stepIndex};
  });
}
