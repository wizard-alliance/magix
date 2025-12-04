/**
 * Service: OpenRouter
 * Handles OpenRouter specific functionalities such as Completion with different model support.
 *
 * @since 0.0.2
 */
import type { ORConfig, ORCompletionResults, ORMessage } from "../types/types.js"

export class OpenRouter {

	private readonly prefix = "OpenRouter"
	private publicKey: string
	private url: string
	private model: string = "openai/gpt-4.1"
	private temperature: number = 0.5
	private maxTokens: number = 35000
	private MaxThinkingTokens: number = 2000
	
	constructor( config : ORConfig ) {
		this.publicKey = api.Config("OPENROUTER_API_KEY")
		this.url = api.Config("OPENROUTER_BASE_URL") + api.Config("OPENROUTER_CHAT_ENDPOINT")

		if ( !this.publicKey || this.publicKey.trim().length === 0) {
			api.Log("OpenRouter public key is missing in configuration", this.prefix, "error")
			throw api.Error("OpenRouter public key is missing in configuration", this.prefix)
		}

		this.setModel( config.model || api.Config("OPENROUTER_MODEL") )
		this.setMaxTokens( Number(config.maxTokens || api.Config("OPENROUTER_MAX_TOKENS")) )
		this.setMaxThinkingTokens( Number(config.maxThinkingTokens || api.Config("OPENROUTER_MAX_THINKING_TOKENS")) )
		this.setTemperature( Number(config.temperature || api.Config("OPENROUTER_TEMPERATURE")) )
	}

	getModel() : string {
		return this.model
	}

	setModel(model = "openai/gpt-4.1") : string {
		this.model = model
		return this.model
	}

	setTemperature(temperature = 0.5) : number {
		this.temperature = temperature
		return this.temperature
	}

	setMaxTokens(maxTokens = 3000) : number {
		this.maxTokens = maxTokens
		return this.maxTokens
	}

	setMaxThinkingTokens(maxThinkingTokens = 2000) : number {
		maxThinkingTokens = Math.min(maxThinkingTokens, this.maxTokens)
		this.MaxThinkingTokens = maxThinkingTokens
		return this.MaxThinkingTokens
	}

	async test() : Promise<void> {
		const request = await this.completion("Max 5-8 words, say hi as if you are the AI overlord, you just connected to OpenRouter API successfully.")
		api.Log(request.message, this.prefix, "success")
	}

	async completion(prompt : string | ORMessage[], responseFormat: any = {}): Promise<ORCompletionResults> {
		const isStr = typeof prompt === "string"
		const messageStruct: ORMessage[] = isStr ? [{ role: "user", content: prompt }] : prompt

		const options = {
			temperature: this.temperature,
			max_tokens: this.maxTokens,
		}

		let payload = {
			model: this.model,
			messages: messageStruct,
			response_format: responseFormat,
			reasoning: {
				max_tokens: this.MaxThinkingTokens,
				exclude: false,
				enabled: true,
			},
			...options,
		}

		if(! payload.response_format || Object.keys(payload.response_format).length === 0) {
			delete payload.response_format
		}
		
		// console.log(JSON.stringify(payload))

		const requestOptions = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${this.publicKey}`,
			},
			body: JSON.stringify(payload),
		}

		try {
			const endpoint = `${this.url}/completions`
			const response = await fetch(endpoint, requestOptions)
			const rawText = await response.text()
			let data

			try {
				data = rawText ? JSON.parse(rawText) : null

			} catch (parseErr) {
				console.error("[OpenRouter] JSON parse error", {
					endpoint,
					status: response.status,
					statusText: response.statusText,
					bodyPreview: rawText?.slice(0, 1000) ?? "(empty)",
					request: {
						model: this.model,
						temperature: options.temperature,
						max_tokens: options.max_tokens,
						// stop: options.stop,
					},
				})
				throw new Error(
					`OpenRouter returned non-JSON response (status ${response.status}): ${response.statusText}`
				)
			}

			if (!response.ok) {
				const msg =
					data?.error?.message ||
					data?.message ||
					response.statusText ||
					"Unknown error"
				console.log(response)
				throw new Error(`OpenRouter HTTP ${response.status}: ${msg}`)
			}

			// Check for API-level error envelopes
			if (data?.error) {
				throw new Error(data.error.message || "[OpenRouter] API error")
			}

			// Attempt to decode JSON content if applicable
			data.choices[0].message.content = api.Utils.maybeJSONDecode( data.choices[0].message.content )

			// Support both text and chat-style message content
			// const thoughts = data?.choices?.[0]?.text ?? data?.choices?.[0]?.message?.reasoning ?? ''
			const results : ORCompletionResults = {
				message : data.choices[0].message.content,
				reasoning : data.choices[0].message.reasoning,
				response : data.choices[0],
				usage: data?.usage
			}

			// Normalize to plain string when content parts are returned
			if (Array.isArray(results.message)) {
				const parts = results.message
					.filter((p) => p && typeof p === "object")
					.map((p) => (p.type === "text" ? String(p.text ?? "") : ""))
					.filter(Boolean)
				results.message = parts.join("\n")
			}

			return results
			
		} catch (error : any) {
			console.error("[OpenRouter] completion error", {
				message: error.message,
			})
			throw new Error(`Error fetching completion: ${error.message}`)
		}
	}

}