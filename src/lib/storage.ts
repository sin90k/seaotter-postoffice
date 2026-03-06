import { get, set } from 'idb-keyval';
import { ProcessedPostcard } from '../App';

export const saveHistory = async (history: ProcessedPostcard[]) => {
  await set('postcard_history', history);
};

export const loadHistory = async (): Promise<ProcessedPostcard[]> => {
  return (await get('postcard_history')) || [];
};
