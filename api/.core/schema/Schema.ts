import * as AuthShapesSchema from "./AuthShapes.js"
import * as DatabaseSchema from "./Database.js"
import * as DomainShapesSchema from "./DomainShapes.js"

export type SchemaType = {
	AuthShapes: typeof AuthShapesSchema
	Database: typeof DatabaseSchema
	DomainShapes: typeof DomainShapesSchema
}

export {
	AuthShapesSchema as AuthShapes,
	DatabaseSchema as Database,
	DomainShapesSchema as DomainShapes
}