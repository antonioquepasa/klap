import { rollup, watch } from 'rollup'
import { error, info } from './logger'
import { plugins } from './plugins'
import { getOptions } from './options'
import { dirname } from 'path'
import del from 'del'

const createConfig = (command, pkg, options) => {
	const { dependencies = {}, peerDependencies = {}, main, module, browser } = pkg
	const { name, globals, example, source, sourcemap } = options
	const external = command === 'start' ? [] : Object.keys({ ...dependencies, ...peerDependencies })

	let inputOptions = {
		external,
		input: command === 'start' ? example : source,
		plugins: plugins(command, pkg, options),
	}

	const defaultOptions = { esModule: false, strict: false, freeze: false }

	let outputOptions = [
		main && { ...defaultOptions, file: main, format: 'cjs', sourcemap },
		module && { ...defaultOptions, file: module, format: 'es', sourcemap },
		browser && { ...defaultOptions, file: browser, format: 'umd', name, sourcemap, globals },
	].filter(Boolean)

	return { inputOptions, outputOptions }
}

const writeBundle = async (bundle, outputOptions) => {
	await bundle.generate(outputOptions)
	await bundle.write(outputOptions)
}

const deleteDirs = async pkg => {
	const dirs = {}
	;['main', 'module', 'browser'].map(type => pkg[type] && (dirs[dirname(pkg[type])] = true))
	await del(Object.keys(dirs))
}

const klap = async (command, pkg) => {
	const options = getOptions(pkg)
	const { inputOptions, outputOptions } = createConfig(command, pkg, options)
	await deleteDirs(pkg)
	switch (command) {
		case 'build':
			const bundle = await rollup(inputOptions)
			outputOptions.map(opts => writeBundle(bundle, opts))
			break
		case 'watch':
		case 'start':
			const watchOptions = {
				...inputOptions,
				output: outputOptions,
			}
			const watcher = watch(watchOptions)
			watcher.on('event', event => {
				switch (event.code) {
					case 'ERROR':
						error(event.error)
						break
					case 'END':
						info(`${new Date().toLocaleTimeString('en-GB')} - Waiting for Changes...`)
						break
				}
			})
			break
	}
}

export { klap }

// Experimental: Export internals to support extending parts of `klap`
// Remove parts once we determine what we need in `tslib-cli`
export { error, info, log, warn, gray, green, bold } from './logger'
export { getOptions } from './options'
export { plugins } from './plugins'
export { init } from './init'
export { exists, read, write, safePackageName } from './utils'
export { babelConfig } from './babel'
export { terser } from './packages/terser'
export { sizeme } from './packages/sizeme'
export { servor } from './packages/servor'
