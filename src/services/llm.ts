// Single place to change the Groq model (Groq retires models without notice;
// llama-3.3-70b-versatile now returns 404).
export const GROQ_MODEL = 'openai/gpt-oss-120b';

/** gpt-oss spends part of max_tokens on reasoning, so keep it short and leave headroom. */
export const GROQ_MODEL_OPTIONS = { reasoning_effort: 'low' as const };
