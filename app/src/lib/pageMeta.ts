import type { PageLoadData } from './types/meta'

type PageMetaInput = Partial<PageLoadData> & Pick<PageLoadData, 'slug' | 'title' | 'icon' | 'description'>

// Page meta factory — supplies default values so each +page.ts stays lean.
// Defaults: sidebars 0+1 visible, sidebar 2 hidden, nav null, seo empty.
// Override any field by including it in the input object.
export const pageMeta = (data: PageMetaInput): PageLoadData => ({
	sidebars: { 0: true, 1: true, 2: false },
	nav: null,
	seo: {},
	...data,
})
