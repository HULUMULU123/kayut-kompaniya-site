import { startOfDay, addDays } from './util.js';

const listeners = new Set();
const today = startOfDay(new Date());

export const state = {
  mode: 'whole',            // whole | bunk
  gender: 'male',
  checkIn: today,
  checkOut: addDays(today, 1),
  adults: 2,
  children: 0,
  query: null,              // зафиксированный запрос (после «Найти каюту»)
  filter: 'all',            // чип-фильтр
  chipAuto: false,          // чип подобран автоматически из запроса
  searched: false,
  view: 'schema',
};

export const snapshotQuery = () => ({ mode: state.mode, gender: state.gender, adults: state.adults, children: state.children });
state.query = snapshotQuery();

export function set(patch, meta = {}) {
  Object.assign(state, patch);
  listeners.forEach((fn) => fn(state, meta));
}
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
