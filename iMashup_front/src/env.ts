// src/utils/env.ts
export const isElectron = (): boolean => {
  // 方法1：检测 Electron 特有对象
  return !!(window && (window as any).electronAPI)
  
  // 或方法2：检测 Node.js 环境
  // return !!(typeof process !== 'undefined' && process.versions?.electron)
}

export const isDevelopment = (): boolean => {
  return import.meta.env.MODE === 'development'
}