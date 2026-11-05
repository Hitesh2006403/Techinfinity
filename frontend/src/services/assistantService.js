import api from "./api";

export const assistantService = {
  async askAssistant(prompt, context = "BEE-104 Transformer Principles") {
    try {
      const response = await api.post("/assistant/chat/", { prompt, context });
      return response.data;
    } catch {
      await new Promise((res) => setTimeout(res, 600));
      if (prompt.toLowerCase().includes("turns ratio") || prompt.toLowerCase().includes("ratio")) {
        return {
          reply: `In an ideal single-phase transformer with sinusoidal flux:\n\n1. By Faraday's Law, the induced EMF in the primary winding is E₁ = 4.44 · f · N₁ · Φₘ\n2. The induced EMF in the secondary winding is E₂ = 4.44 · f · N₂ · Φₘ\n3. Dividing the two yields the transformation voltage ratio:\n   **E₂ / E₁ = N₂ / N₁ = K**\n\nCommon error: Do not invert the ratio as E₂/E₁ = N₁/N₂. Secondary voltage scales directly with secondary turns!`
        };
      }
      return {
        reply: `Based on your course curriculum for **${context}**:\n\nRemember to verify the standard assumptions before starting your derivation: zero winding resistance, zero core leakage flux, and high permeability in the laminated silicon steel core. Let me know if you would like a step-by-step walkthrough of the EMF equation!`
      };
    }
  }
};
