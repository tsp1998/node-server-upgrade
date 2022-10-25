const axios = require('axios')
const express = require('express')
const app = express();
const { spawn } = require('child_process')

const [_, __, who = 'service', version='1.0'] = process.argv
let PORT = 3001;
let closeServer = () => undefined

const runShell = (command) => {
  const terminal = spawn('bash')
  terminal.stdout.on('data', (data) => {
    console.log(Buffer.from(data).toString())
  })
  terminal.stdin.write(command)
  terminal.stdin.end()
}

if (who === 'service') {
  PORT = 3000;
  runShell('node src/index.js server')
}

app.get('/', (req, res) => {
  res.send(`Hello from ${who} ${version}`);
})

app.get('/upgrade/:version', async (req, res) => {
  if (who !== 'service') {
    res.send('No privilege')
  }
  const newVersion = req.params.version;
  try {
    const response = await axios.get('http://localhost:3001/stop')
    console.log(`response`, response)
    runShell(`node src/index.js server ${newVersion}`)
  } catch (error) {
    console.log(`error`, error)
  }
  res.send(`Upgrading to version ${newVersion}`)
})

app.get('/start', (req, res) => {
  if (who === 'service') {
    res.send(`Starting server ${version}`)
    return runShell('node src/index.js server')
  }
  res.send('No privilege')
})

app.get('/stop', async (req, res) => {
  res.send(`Closing ${who} ${version}`);
  closeServer()
})

const server = app.listen(PORT, () => {
  console.log(`App is listening on PORT ${PORT}`);
})

closeServer = () => {
  server.closeAllConnections()
  server.close()
}