declare module "wordnet-db" {
  const wordnetDB: {
    path: string;
    version: string;
    libVersion: string;
    files: string[];
  };

  export = wordnetDB;
}

declare module "wordnet" {
  interface WordNetDefinition {
    glossary: string;
    meta: {
      synsetType: string;
    };
  }

  interface WordNet {
    init(databaseDir?: string): Promise<void>;
    lookup(
      word: string,
      skipPointers?: boolean
    ): Promise<WordNetDefinition[]>;
    list(): Promise<string[]>;
  }

  const wordnet: WordNet;

  export = wordnet;
}