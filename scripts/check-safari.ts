import assert from 'node:assert/strict'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { networkInterfaces } from 'node:os'
import { join, resolve } from 'node:path'
import { productionPreview, runLogged, unusedPort } from './lib/production-preview'

const ios = Bun.argv.includes('--ios')
const renderOnly = Bun.argv.includes('--render-only')
await mkdir('tmp', { recursive: true })
const artifacts = await mkdtemp(resolve(`tmp/safari-${ios ? 'ios' : 'mac'}-`))
console.log(`Safari artifacts: ${artifacts}`)
const preview = await productionPreview(artifacts)
const port = await unusedPort()
const driver = Bun.spawn(['/System/Cryptexes/App/usr/bin/safaridriver', '--port', String(port)], {
  stdout: Bun.file(join(artifacts, 'driver.log')),
  stderr: Bun.file(join(artifacts, 'driver.stderr.log')),
  stdin: 'ignore',
})
let session = ''
let securePreview: ReturnType<typeof Bun.serve> | undefined
const records: unknown[] = []
async function request<T>(path: string, method = 'POST', body?: unknown): Promise<T> {
  const response = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(35_000),
  })
  const result = (await response.json()) as {
    value: T & { error?: string; message?: string }
    error?: string
    message?: string
  }
  if (!response.ok || result.value?.error || result.error) {
    const detail = result.value?.message || result.message || ''
    const message = /device is not paired/i.test(detail)
      ? 'Connected device is not paired for Safari automation'
      : detail.split('\n')[0]
    throw new Error(
      `${method} ${path}: ${result.value?.error || result.error || `WebDriver HTTP ${response.status}`} ${message}`
    )
  }
  return result.value
}
const command = <T>(path: string, body?: unknown, method = 'POST') =>
  request<T>(`/session/${session}/${path}`, method, body)
const script = <T>(source: string, args: unknown[] = []) =>
  command<T>('execute/sync', { script: source, args })
async function wait(source: string, args: unknown[] = []) {
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    if (await script<boolean>(source, args)) return
    await Bun.sleep(150)
  }
  throw new Error(`Safari condition failed: ${source}`)
}
async function element(selector: string) {
  const result = await command<Record<string, string>>('element', {
    using: 'css selector',
    value: selector,
  })
  return result['element-6066-11e4-a52e-4f735466cecf']
}
async function click(selector: string) {
  const id = await element(selector)
  await command(`element/${id}/click`, {})
  if (ios) await command('actions', undefined, 'DELETE')
  return id
}
async function type(id: string, text: string) {
  await command(`element/${id}/value`, { text, value: Array.from(text) })
}
async function screenshot(name: string) {
  await Bun.sleep(900)
  const encoded = await command<string>('screenshot', undefined, 'GET')
  await writeFile(join(artifacts, `${name}.png`), Buffer.from(encoded, 'base64'))
}
async function bounds(selector: string) {
  await script(
    'document.querySelector(arguments[0]).scrollIntoView({block:"center",behavior:"instant"})',
    [selector]
  )
  await Bun.sleep(200)
  return script<{ x: number; y: number; width: number; height: number }>(
    'return document.querySelector(arguments[0]).getBoundingClientRect().toJSON()',
    [selector]
  )
}
async function tap(selector: string) {
  const box = await bounds(selector)
  await command('actions', {
    actions: [
      {
        type: 'pointer',
        id: 'tap',
        parameters: { pointerType: ios ? 'touch' : 'mouse' },
        actions: [
          {
            type: 'pointerMove',
            duration: 0,
            x: Math.round(box.x + box.width / 2),
            y: Math.round(box.y + box.height / 2),
            origin: 'viewport',
          },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: 150 },
          { type: 'pointerUp', button: 0 },
          { type: 'pause', duration: 150 },
        ],
      },
    ],
  })
  await command('actions', undefined, 'DELETE')
}
async function drag(selector: string) {
  const box = await bounds(selector)
  const y = Math.round(box.y + box.height / 2)
  await command('actions', {
    actions: [
      {
        type: 'pointer',
        id: 'drag',
        parameters: { pointerType: ios ? 'touch' : 'mouse' },
        actions: [
          {
            type: 'pointerMove',
            duration: 0,
            x: Math.round(box.x + box.width * 0.3),
            y,
            origin: 'viewport',
          },
          { type: 'pointerDown', button: 0 },
          {
            type: 'pointerMove',
            duration: 350,
            x: Math.round(box.x + box.width - 1),
            y,
            origin: 'viewport',
          },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ],
  })
  await command('actions', undefined, 'DELETE')
}
try {
  const deadline = Date.now() + 5000
  while (Date.now() < deadline) {
    const ready = await fetch(`http://127.0.0.1:${port}/status`).catch(() => null)
    if (ready?.ok) break
    await Bun.sleep(100)
  }
  const created = await request<{
    sessionId: string
    capabilities: { browserVersion: string; platformName: string }
  }>('/session', 'POST', {
    capabilities: {
      alwaysMatch: {
        browserName: 'safari',
        platformName: ios ? 'iOS' : 'macOS',
        acceptInsecureCerts: ios,
        ...(ios ? { 'safari:useSimulator': false, 'safari:deviceType': 'iPhone' } : {}),
        ...(ios && Bun.env.LIVENUI_DEVICE_UDID
          ? { 'safari:deviceUDID': Bun.env.LIVENUI_DEVICE_UDID }
          : {}),
      },
    },
  })
  session = created.sessionId
  await command('timeouts', { implicit: 5000, pageLoad: 30_000, script: 10_000 })
  if (!ios) await command('window/rect', { width: 1440, height: 1100 })
  const host =
    Bun.env.LIVENUI_DEVICE_HOST ||
    Object.values(networkInterfaces())
      .flat()
      .find((item) => item && !item.internal && item.family === 'IPv4')?.address
  if (ios && !host)
    throw new Error('Set LIVENUI_DEVICE_HOST to the Mac address reachable by the device')
  if (ios) {
    await runLogged(
      [
        'openssl',
        'req',
        '-x509',
        '-newkey',
        'rsa:2048',
        '-nodes',
        '-keyout',
        join(artifacts, 'key.pem'),
        '-out',
        join(artifacts, 'cert.pem'),
        '-days',
        '1',
        '-subj',
        '/CN=localhost',
        '-addext',
        `subjectAltName=DNS:localhost,IP:${host}`,
      ],
      resolve('.'),
      join(artifacts, 'certificate.log')
    )
    securePreview = Bun.serve({
      hostname: '0.0.0.0',
      port: 0,
      tls: {
        key: Bun.file(join(artifacts, 'key.pem')),
        cert: Bun.file(join(artifacts, 'cert.pem')),
      },
      async fetch(request) {
        const url = new URL(request.url)
        const target = new URL(preview.origin)
        target.pathname = url.pathname
        target.search = url.search
        const response = await fetch(target)
        const headers = new Headers(response.headers)
        headers.delete('content-encoding')
        headers.delete('content-length')
        return new Response(response.body, { status: response.status, headers })
      },
    })
  }
  const origin = ios ? `https://${host}:${securePreview?.port}` : preview.origin
  for (const theme of ['light', 'dark']) {
    await command('url', { url: `${origin}/studio?library=beam` })
    await script('localStorage.setItem("theme",arguments[0])', [theme])
    await command('refresh', {})
    await wait('return !!document.querySelector(".preview-stage [data-beam]")')
    await screenshot(`studio-${theme}-beam`)
    let copied: string | undefined
    if (!renderOnly) {
      await drag('#prop-duration-range')
      await wait(
        'return document.querySelector(".code-panel code")?.textContent.includes("duration={10}")'
      )
      records.push({ theme, phase: 'range-drag', passed: true, physicalDevice: ios })
      const duration = '#prop-duration'
      const id = await element(duration)
      await script(
        'window.numericEvents=[];for(const type of ["pointerdown","pointerup","pointercancel","gotpointercapture","lostpointercapture","touchstart","touchend","click","focusin","focusout"]){document.addEventListener(type,event=>window.numericEvents.push({type,target:event.target.id,x:event.clientX,y:event.clientY,pointer:event.pointerType,active:document.activeElement?.id}),true)}'
      )
      await tap('.number-row:has(#prop-duration) .number-value')
      await Bun.sleep(500)
      await writeFile(
        join(artifacts, `numeric-${theme}.json`),
        JSON.stringify(
          await script(
            'return {events:window.numericEvents,active:document.activeElement?.id,value:document.querySelector("#prop-duration").getBoundingClientRect().toJSON(),viewport:{width:innerWidth,height:innerHeight,offset:visualViewport.offsetTop,visualHeight:visualViewport.height}}'
          ),
          null,
          2
        )
      )
      await command(`element/${id}/clear`, {})
      await tap('.number-row:has(#prop-duration) .number-value')
      await wait('return document.activeElement?.id === "prop-duration"')
      await type(id, '2.5\uE007')
      await wait(
        'return document.querySelector(".code-panel code")?.textContent.includes("duration={2.5}")'
      )
      const focus = await script<{ width: string; offset: string; input: string }>(
        'const i=document.querySelector(arguments[0]),s=getComputedStyle(i.closest(".number-row"));return {width:s.outlineWidth,offset:s.outlineOffset,input:getComputedStyle(i).outlineStyle}',
        [duration]
      )
      assert.deepEqual(focus, { width: '2px', offset: '-2px', input: 'none' })
      await screenshot(`studio-${theme}-focus`)
      await drag('#prop-duration-range')
      await wait(
        'return document.querySelector(".code-panel code")?.textContent.includes("duration={10}")'
      )
      await click('[role="tab"][aria-controls$="-panel-code"]')
      await wait('return !!document.querySelector(".install-panel code")')
      const copy = await click('.install-panel button[aria-label="Copy command"]')
      await wait(
        'return ["Copied","Copy failed"].includes(document.querySelector(arguments[0])?.title)',
        ['.install-panel button[aria-label="Copy command"]']
      )
      copied = await command<string>(`element/${copy}/attribute/title`, undefined, 'GET')
      await screenshot(`studio-${theme}-code`)
    }

    for (const library of ['orbs', 'metal', 'gooey', 'voice', 'image', 'avatars']) {
      await command('url', { url: `${origin}/studio?library=${library}` })
      await wait(
        'return !!document.querySelector(".preview-stage canvas,.preview-stage .gooey-demo")'
      )
      assert.equal(
        await script('return document.querySelectorAll(".preview-stage [role=alert]").length'),
        0
      )
      assert.equal(await script('return document.documentElement.scrollWidth <= innerWidth'), true)
      await screenshot(`studio-${theme}-${library}`)
    }
    await command('url', { url: `${origin}/agents/avatars` })
    await wait(
      'return !!document.querySelector(".avatar-chat-actor canvas") && document.querySelector(".avatar-chat-dialog")?.matches(":modal")'
    )
    if (renderOnly) {
      records.push({
        theme,
        platform: created.capabilities.platformName,
        version: created.capabilities.browserVersion,
        physicalDevice: ios,
        scope: 'renderers',
        viewport: await script('return {width:innerWidth,height:innerHeight,dpr:devicePixelRatio}'),
      })
      await screenshot(`chat-${theme}-initial`)
      continue
    }
    const initialHeight = await script<number>('return visualViewport.height')
    const message = await click('.avatar-chat-composer textarea')
    await type(message, 'Say hello')
    await wait(
      'return document.querySelector(".avatar-chat-composer textarea")?.value === "Say hello"'
    )
    await Bun.sleep(500)
    const geometry = await script<{
      height: number
      keyboardObserved: boolean
      contained: boolean
      active: boolean
    }>(
      'const v=visualViewport,b=document.querySelector(".avatar-chat-composer").getBoundingClientRect();return {height:v.height,keyboardObserved:v.height<arguments[0]-80,contained:b.top>=v.offsetTop&&b.bottom<=v.offsetTop+v.height+1,active:document.activeElement?.matches(".avatar-chat-composer textarea")}',
      [initialHeight]
    )
    assert.equal(geometry.active, true)
    assert.equal(geometry.contained, true, 'Composer is covered by the physical keyboard')
    await screenshot(`chat-${theme}-keyboard`)
    await click('button[aria-label="Send message"]')
    await wait('return document.querySelectorAll(".avatar-chat-message").length > 0')
    const viewport = await script(
      'return {width:innerWidth,height:innerHeight,dpr:devicePixelRatio}'
    )
    records.push({
      theme,
      platform: created.capabilities.platformName,
      version: created.capabilities.browserVersion,
      physicalDevice: ios,
      scope: 'integration-drag-focus-and-chat',
      viewport,
      geometry,
      copied,
    })
    await screenshot(`chat-${theme}-reply`)
  }
  await writeFile(
    join(artifacts, 'result.json'),
    JSON.stringify({ passed: true, records }, null, 2)
  )
  console.log(
    `PASS: Safari ${ios ? 'physical iPhone' : 'macOS'} ${renderOnly ? 'renderer' : 'integration, drag, focus and chat'} checks`
  )
} catch (error) {
  if (session) await screenshot('failure').catch(() => undefined)
  await writeFile(
    join(artifacts, 'result.json'),
    JSON.stringify(
      { passed: false, records, error: error instanceof Error ? error.message : String(error) },
      null,
      2
    )
  )
  throw error
} finally {
  if (session)
    await request(`/session/${session}`, 'DELETE').catch((error) =>
      console.error(
        `Safari session cleanup failed: ${error instanceof Error ? error.message : String(error)}`
      )
    )
  securePreview?.stop(true)
  driver.kill('SIGTERM')
  await driver.exited
  await preview.stop()
}
