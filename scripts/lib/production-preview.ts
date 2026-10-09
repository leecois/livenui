import { createServer } from 'node:net'
import { join, resolve } from 'node:path'

export async function unusedPort() {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '0.0.0.0', resolve)
  })
  const address = server.address()
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  )
  if (!address || typeof address === 'string') throw new Error('Missing preview port')
  return address.port
}

export async function runLogged(command: string[], cwd: string, log: string) {
  const process = Bun.spawn(command, {
    cwd,
    stdout: Bun.file(log),
    stderr: Bun.file(log.replace(/\.log$/, '.stderr.log')),
    stdin: 'ignore',
  })
  const exit = await process.exited
  if (exit !== 0) throw new Error(`${command[0]} failed with exit ${exit}; inspect ${log}`)
}

export async function productionPreview(artifacts: string) {
  const port = await unusedPort()
  const origin = `http://127.0.0.1:${port}`
  const process = Bun.spawn(['bun', 'run', 'start'], {
    cwd: resolve('.'),
    env: { ...Bun.env, PORT: String(port) },
    stdout: Bun.file(join(artifacts, 'production-server.log')),
    stderr: Bun.file(join(artifacts, 'production-server.stderr.log')),
    stdin: 'ignore',
  })
  const stop = async () => {
    if (process.exitCode !== null) return
    process.kill('SIGTERM')
    const exited = await Promise.race([
      process.exited.then(() => true),
      Bun.sleep(5000).then(() => false),
    ])
    if (!exited) process.kill('SIGKILL')
    await process.exited
  }
  try {
    const deadline = Date.now() + 30_000
    while (Date.now() < deadline) {
      if (process.exitCode !== null) throw new Error('Production preview exited before readiness')
      const response = await fetch(origin, { signal: AbortSignal.timeout(1000) }).catch(() => null)
      if (response?.ok) return { origin, port, stop }
      await Bun.sleep(250)
    }
    throw new Error('Production preview did not become ready')
  } catch (error) {
    await stop()
    throw error
  }
}
