import { configureStore } from "@reduxjs/toolkit";
import counter from "./reducer";
export const store = configureStore({
  reducer: {
    counter
  }
});