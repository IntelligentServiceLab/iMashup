
//  // 当页面加载完成后运行
//  window.addEventListener('DOMContentLoaded', () => {
//   const messageInput = document.getElementById('message');
//   const resultInput = document.getElementById('result');

//   // 提交按钮点击事件
//   const getResult = () => {
//     // const message = messageInput.value;  // 获取输入框的值
//     // const result = message.split('').reverse().join('');  // 反转字符串
//     // resultInput.value = result;  // 将反转后的结果赋值给结果输入框
//     console.log('123');
//   }

//   // 绑定按钮的点击事件
//   const button = document.querySelector('button');
//   button.addEventListener('click', getResult);
// });

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  loadFlowData: () => ipcRenderer.invoke('load-flow-data'),
  triggerBuild: (flowData) => ipcRenderer.invoke('trigger-build', flowData),
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),
  saveFlowData: (data) => ipcRenderer.invoke('save-flow-data', data)
})