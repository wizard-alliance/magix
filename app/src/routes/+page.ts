import { app } from "$lib/app"
import { redirect } from "@sveltejs/kit"
import type { PageLoad } from "./$types"

export const load: PageLoad = () => {
	throw redirect(308, `/home`)
}