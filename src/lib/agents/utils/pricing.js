/**
 * Pricing configuration for AI Models used in Coursify
 * Costs are defined in USD per token.
 */

export const MODEL_PRICING = {
  // Input: $2.5 / million tokens
  INPUT_USD_PER_TOKEN: 2.5 / 1000000,
  // Output: $15 / million tokens
  OUTPUT_USD_PER_TOKEN: 15 / 1000000,
};

/**
 * Calculate the estimated cost in USD based on token usage.
 * @param {number} promptTokens
 * @param {number} completionTokens
 * @returns {number} Cost in USD
 */
export function calculateEstimatedCostUSD(promptTokens = 0, completionTokens = 0) {
  return (
    promptTokens * MODEL_PRICING.INPUT_USD_PER_TOKEN +
    completionTokens * MODEL_PRICING.OUTPUT_USD_PER_TOKEN
  );
}
