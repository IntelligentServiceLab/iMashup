import { createSlice } from "@reduxjs/toolkit";
const initialState = { value: 1 };
// 创建切片
const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    increment: state => {
      state.value += 1;
    },
    decrement: state => {
      state.value -= 1;
    },
    addValue: (state, action) => {
      state.value += action.payload;
    }
  }
});

export const { increment, decrement, addValue } = counterSlice.actions;
export default counterSlice.reducer;
// 导出异步操作动作
export const syncAddvalue = (value: number) => (dispatch: any) => {
  setTimeout(() => {
    dispatch(addValue(value));
  }, 2000);
};