import wordnet from "wordnet";
import path from "node:path";

export interface WordDefinition {
  type: string;
  definition: string;
}
let wordnetInit: Promise<void> | undefined;

export function initializeWordnet() {
  if (!wordnetInit) {
    wordnetInit = wordnet.init(
      path.join(__dirname, "dict")
    ).catch((error) => {
      wordnetInit = undefined;
      throw error;
    });
  }

  return wordnetInit;
}
export async function define(
  word: string
): Promise<WordDefinition[]> {
  try {
    const results = await wordnet.lookup(word);

    const seen = new Set<string>();

    return results
      .filter(item => item.glossary?.trim())
      .filter(item => {
        const key = `${item.meta.synsetType}:${item.glossary.trim()}`;

        if (seen.has(key)) return false;

        seen.add(key);
        return true;
      })
      .map(item => ({
        type: item.meta.synsetType,
        definition: item.glossary.trim()
      }));

  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("No definition(s) found")
    ) {
      return [];
    }

    throw error;
  }
}
