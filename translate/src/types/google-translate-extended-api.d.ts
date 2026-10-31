
declare module "google-translate-extended-api" {
  interface TranslateOptions {
    returnRawResponse?: boolean;
    detailedTranslations?: boolean;
    definitionSynonyms?: boolean;
    detailedTranslationsSynonyms?: boolean;
    articles?: "none" | "combine" | "separate";
    definitions?: boolean;
    definitionExamples?: boolean;
    examples?: boolean;
    removeStyles?: boolean;
  }

  interface Definition {
    definition: string;
    example?: string;
    synonyms?: Record<string, string[]>;
  }

  export interface TranslateResult {
    word: string;
    translation: string;
    detectedSourceLang: string;
    wordTranscription: string | null;
    translationTranscription: string | null;
    translations?: Record<string, string[]>;
    definitions?: Record<string, Array<string | Definition>>;
    examples?: string[];
  }

  function translate(
    text: string,
    sourceLang: string,
    destLang: string,
    options?: TranslateOptions
  ): Promise<TranslateResult>;

  export = translate;
}
