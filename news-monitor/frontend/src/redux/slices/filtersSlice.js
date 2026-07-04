import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  query: '',
  languages: [],
  editions: [],
  publishers: [],
  countries: [],
  tags: [],
  categories: [],
  fromDate: null,
  toDate: null,
  selectedArticleIds: [],
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilter(state, action) {
      const { key, value } = action.payload;
      state[key] = value;
    },
    resetFilters() {
      return initialState;
    },
    toggleArticleSelection(state, action) {
      const id = action.payload;
      state.selectedArticleIds = state.selectedArticleIds.includes(id)
        ? state.selectedArticleIds.filter((x) => x !== id)
        : [...state.selectedArticleIds, id];
    },
    clearSelection(state) {
      state.selectedArticleIds = [];
    },
  },
});

export const { setFilter, resetFilters, toggleArticleSelection, clearSelection } = filtersSlice.actions;
export default filtersSlice.reducer;
