2025.04.04
- [ ] 添加类型——>弹窗：变量名 + 变量值（主要是右边的变量值是根据前面的变量来动态生成的，这里先看能不能直接拿到（set之后get），拿不到就需要redux动态管理，并且redux要和InitialNodes一起变化） ❌
- [x] 中间节点和结束节点都要能修改 变量名和类型    
- [x] 把所有接口都删掉，直接用setNodes修改  



2025.04.11
- [x] 在自定义的节点或者边中拿到/修改  
  import {
  useReactFlow
  } from '@xyflow/react';
  const { getEdges,setEdges  } = useReactFlow();
  const { getNodes,setNodes  } = useReactFlow();
- [x] 根据边修改节点 
  const sourceNode = nodes.find(node => node.id === source);
  const targetNode = nodes.find(node => node.id === target);
- [x] 或者只传递数据，之后导入数据在本系统修改，只支持在本系统做这个事情 
  想要拿到弹窗的内容，必须先打开弹窗，才能在浏览器中添加，否则无法拿到——> 现在就有个问题，能不能直接传送数据给后端，后端处理就行了；后面上传的时候，只需要上传数据就行，不需要上传html，因为html是动态生成的，想要查看的话，就导入上传到云端的数据，就能看到最终的效果了



2025.04.18
- [x] 中间节点的参数名要提示约束（按照顺序给参数名，param、text，param、text这样） 
- [x] 导入和导出要写一个接口 



2025.04.19
- [ ] 在APP.jsx中也要用到 eventBus.emit('dataUpdated');在连接线的时候，同时删除线应该也要用到 ❌
- [x] 调整一下节点顺序 



2025.04.25
- [ ] 打包成一个可执行exe，只需要输入，就能得到输出(拿到edges和nodes，exe显示input和output，点击时调用执行函数,生成exe就行，不需要转换)
- [x] 导出后给的id一键复制 
- [ ] 中间节点加一个描述 ❌
- [x] 添加API节点的时候，不能是默认为API，应该可以改的(API名字地址递增) 
- [x] 添加边的时候，选择输入的时候No Data（所有setXxx处都去emit一次）
- [x] 执行后应该有一个等待图标(loading) 
- [x] output same name 爆警告（给key值加个前缀）
- [x] 在边的中间添加节点 
- [x] 删除input不能删除完毕 
- [x] 用了event需要clear 



2025.04.26
- [x] 修改 - 的位置 
- [x] 在添加input 的时候，选择里面选的是前面一个节点的output

2025.4.27
- [ ] 打包成一个可执行exe，只需要输入，就能得到输出(拿到edges和nodes，exe显示input和output，点击时调用执行函数,生成exe就行，不需要转换)
      点击打包按钮，数据都传给后端，后端生成exe，返回exe的地址，前端下载exe（数据传到main.html文件中，再打包）
      
- [ ] 打包dist文件
