// import axios from 'axios';
// console.log('console.log(InitialNodes);');
// const result = axios.get(`http://118.25.40.159:8080/import?mesId=nodeAndEdge_1748245153681`);
// const InitialNodes = result.data;
// console.log(InitialNodes);

// const inputsContainer = document.getElementById('inputs');
// const outputsContainer = document.getElementById('outputs');
// // 清空现有的内容
// inputsContainer.innerHTML = '';
// outputsContainer.innerHTML = '';
// // 遍历 InitialNodes，提取 label 为 "开始" 的 inputs 和 label 为 "结束" 的 outputs
// InitialNodes.nodes.forEach(node => {
//     const { label, inputs, outputs } = node.data;

//     if (label === "开始" && inputs) {
//         // 动态生成开始的 inputs
//         inputs.forEach(input => {
//             const inputElement = document.createElement('input');
//             inputElement.type = input.type; // 设置 input 类型
//             inputElement.name = input.name;
//             inputElement.placeholder = input.text; // 设置 placeholder 为 text
//             inputsContainer.appendChild(inputElement); // 将 input 添加到 inputs 容器
//         });
//     }

//     if (label === "结束" && outputs) {
//         // 动态生成结束的 outputs
//         outputs.forEach(output => {
//             const outputElement = document.createElement('input');
//             outputElement.type = output.type; // 设置 input 类型
//             outputElement.name = output.name;
//             outputElement.placeholder = output.text; // 设置 placeholder 为 text
//             outputsContainer.appendChild(outputElement); // 将 input 添加到 outputs 容器
//         });
//     }
// });

