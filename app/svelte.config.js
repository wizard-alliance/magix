// import adapter from "@sveltejs/adapter-node"
import adapter from "@sveltejs/adapter-node"
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

const config = {
	preprocess: [vitePreprocess()],
	kit: {
		adapter: adapter({ 
			out: ".dist"
		}),
		alias: {
			$configs: "./src/configs",
			$lib: "./src/lib",
			$styles: "./src/styles",
			$components: "./src/components",
			$assets: "./src/assets",
			$images: "./src/assets/images",
		},
	},
}

export default config
