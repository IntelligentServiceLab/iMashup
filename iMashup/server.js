// import express from 'express';
// import { exec } from 'child_process';
// import cors from 'cors'; // 引入 CORS

// const app = express();
// const port = 6000; // 你可以选择一个合适的端口

// app.use(cors());

// app.get('/run-make', (req, res) => {
//   exec('npm run make', (err, stdout, stderr) => {
//     if (err) {
//       return res.status(500).send(`Error: ${err.message}`);
//     }
//     if (stderr) {
//       return res.status(500).send(`stderr: ${stderr}`);
//     }
//     res.send(`stdout: ${stdout}`);
//   });
// });

// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });