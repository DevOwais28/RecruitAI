// NODE_ENV decides the mode. Leaving it unset means development; any value
// other than "development" counts as production, so a typo or a name such as
// "staging" can never show error details to clients.
const nodeEnv = process.env.NODE_ENV?.trim().toLowerCase() || "development";

export const envMode = nodeEnv === "development" ? "development" : "production";

export const port = Number(process.env.PORT) || 4000;
