/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { promises as fsp } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve } from 'pathe'
import { globby } from 'globby'

type Dep = { name: string; range: string; type: string }

async function loadPackage(dir: string) {
  const pkgPath = resolve(dir, 'package.json')
  const data = JSON.parse(await fsp.readFile(pkgPath, 'utf-8').catch(() => '{}'))
  // const save = () => fsp.writeFile(pkgPath, JSON.stringify(data, null, 2) + '\n')
  const save = () => console.log(JSON.stringify(data, null, 2))

  const updateDeps = (reviver: (dep: Dep) => Dep | void) => {
    for (const type of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
      if (!data[type]) {
        continue
      }
      for (const e of Object.entries(data[type] as Record<string, string>)) {
        const dep: Dep = { name: e[0], range: e[1], type }
        delete data[type][dep.name]
        const updated = reviver(dep) || dep
        data[updated.type] = data[updated.type] || {}
        data[updated.type][updated.name] = updated.range
      }
    }
  }

  return {
    dir,
    data,
    save,
    updateDeps
  }
}

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T
type Package = ThenArg<ReturnType<typeof loadPackage>>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loadWorkspace(dir: string) {
  const workspacePkg = await loadPackage(dir)
  let pkgDirs = await globby((workspacePkg.data.workspaces as string[]) || [], { onlyDirectories: true })
  // filter
  pkgDirs = pkgDirs.map(dir => (!dir.startsWith('specs/fixtures') ? dir : undefined)).filter(Boolean) as string[]
  console.log('pkgDirs', pkgDirs)

  const packages: Package[] = []

  for (const pkgDir of pkgDirs) {
    const pkg = await loadPackage(pkgDir)
    if (!pkg.data.name) {
      continue
    }
    packages.push(pkg)
  }

  const find = (name: string) => {
    const pkg = packages.find(pkg => pkg.data.name === name)
    if (!pkg) {
      throw new Error('Workspace package not found: ' + name)
    }
    return pkg
  }

  const rename = (from: string, to: string) => {
    find(from).data.name = to
    for (const pkg of packages) {
      pkg.updateDeps(dep => {
        if (dep.name === from && !dep.range.startsWith('npm:')) {
          dep.range = 'npm:' + to + '@' + dep.range
        }
      })
    }
    // Update resolutions field in the root package.json.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, no-prototype-builtins
    if (workspacePkg.data.resolutions?.hasOwnProperty(from)) {
      workspacePkg.data.resolutions[to] = workspacePkg.data.resolutions[from]
      delete workspacePkg.data.resolutions[from]
    }
  }

  const setVersion = (name: string, newVersion: string) => {
    find(name).data.version = newVersion
    for (const pkg of packages) {
      pkg.updateDeps(dep => {
        if (dep.name === name) {
          dep.range = newVersion
        }
      })
    }
  }

  const save = () => Promise.all([...packages.map(pkg => pkg.save()), workspacePkg.save()])

  return {
    dir,
    workspacePkg,
    packages,
    save,
    find,
    rename,
    setVersion
  }
}

async function main() {
  // const workspace = await loadWorkspace(process.cwd())

  const commit = execSync('git rev-parse --short HEAD').toString('utf-8').trim()
  const date = Math.round(Date.now() / (1000 * 60))

  // for (const pkg of workspace.packages.filter(p => !p.data.private)) {
  //   workspace.setVersion(pkg.data.name, `${pkg.data.version}-${date}.${commit}`)
  //   workspace.rename(pkg.data.name, pkg.data.name + '-edge')
  // }

  // await workspace.save()

  const pkgPath = resolve(process.cwd(), 'package.json')
  const pkg = JSON.parse(await fsp.readFile(pkgPath, 'utf-8').catch(() => '{}'))
  pkg.version = `${pkg.version}-${date}.${commit}`
  pkg.name = pkg.name + '-edge'
  await fsp.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
