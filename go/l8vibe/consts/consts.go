package consts

const (
	VNET_PORT                      = uint32(23333)
	WEBSITE_PORT                   = 1443
	WEBSITE_PREFIX                 = "/l8vibe/"
	WEBSITE_CERT                   = "l8vibe"
	ANTHROPIC_HOST                 = "api.anthropic.com"
	ANTHROPIC_API                  = "https://" + ANTHROPIC_HOST + "/v1/messages"
	ANTHROPIC_HEADER_API_KEY       = "x-api-key"
	ANTHROPIC_HEADER_VERSION       = "anthropic-version"
	ANTHROPIC_HEADER_VERSION_VALUE = "2023-06-01"
	ANTHROPIC_MODEL                = "claude-sonnet-4-20250514"
	ANTHROPIC_ENV                  = "ANTHROPIC_API_KEY"
)
