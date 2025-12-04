import { cp, mkdir, rm, stat, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const filePath = fileURLToPath(import.meta.url)
const currentDir = path.dirname(filePath)
const electronDir = path.resolve(currentDir, '..')
const repoRoot = path.resolve(electronDir, '..')
const appDir = path.resolve(repoRoot, 'app')
const appDistDir = path.resolve(appDir, '.dist')
const targetDir = path.resolve(electronDir, 'src', 'resources', 'app-dist')
const appPackagePath = path.resolve(appDir, 'package.json')
const appLockPath = path.resolve(appDir, 'package-lock.json')

const ensureDistExists = async () => {
  try {
    const stats = await stat(appDistDir)
    if (!stats.isDirectory()) throw new Error('App build output missing')
  } catch (error) {
    throw new Error(`Missing app build at ${appDistDir}. Run npm --prefix ../app run build first.`)
  }
}

const copyDist = async () => {
  await rm(targetDir, { recursive: true, force: true })
  await mkdir(targetDir, { recursive: true })
  await cp(appDistDir, targetDir, { recursive: true })
  console.log(`Copied app build to ${targetDir}`)
}

const hasDependencies = (deps = {}) => Object.keys(deps).length > 0

const writeRuntimePackage = async () => {
  const manifestRaw = await readFile(appPackagePath, 'utf8')
  const manifest = JSON.parse(manifestRaw)
  const dependencies = manifest.dependencies || {}

  if (!hasDependencies(dependencies)) {
    console.log('No runtime dependencies found; skipping package install')
    return false
  }

  const runtimePackage = {
    name: manifest.name || 'app',
    version: manifest.version || '0.0.0',
    private: true,
    type: manifest.type || 'module',
    dependencies
  }

  await writeFile(path.join(targetDir, 'package.json'), JSON.stringify(runtimePackage, null, 2))

  try {
    await cp(appLockPath, path.join(targetDir, 'package-lock.json'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }

  return true
}

const resolveNpmCommand = () => {
  const execPath = process.env.npm_execpath
  if (execPath && execPath.endsWith('.js')) {
    const cliPath = path.isAbsolute(execPath) ? execPath : path.resolve(execPath)
		return {
      command: process.execPath,
      args: [cliPath]
		}
	}
	return {
		command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
		args: []
	}
}

const installRuntimeDependencies = async () => {
  const shouldInstall = await writeRuntimePackage()
  if (!shouldInstall) return

  const { command, args: baseArgs } = resolveNpmCommand()
  const installArgs = [...baseArgs, 'install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund']
  await new Promise((resolve, reject) => {
    const child = spawn(command, installArgs, {
      cwd: targetDir,
      stdio: 'inherit'
    })

    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`npm install failed with code ${code}`))
    })

    child.on('error', reject)
  })
}

await ensureDistExists()
await copyDist()
await installRuntimeDependencies()
