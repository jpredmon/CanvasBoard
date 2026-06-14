import type { RootState } from '../index';

export const selectEditMode = (state: RootState) => state.ui.editMode;
export const selectAddCardModalOpen = (state: RootState) => state.ui.addCardModalOpen;
export const selectSaveError = (state: RootState) => state.ui.saveError;
