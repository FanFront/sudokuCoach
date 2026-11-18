import { analyze, generate } from './engine/coach.js';
self.onmessage = ({data}) => {
  try {
    const result = data.type === 'analyze' ? analyze(data.payload) : generate(data.payload);
    self.postMessage({result});
  } catch (error) {
    self.postMessage({error: error.message});
  }
};
