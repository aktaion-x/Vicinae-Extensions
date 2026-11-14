import { useEffect, useState } from "react";
import { Action, getSelectedText, ActionPanel, List, Detail, Icon } from "@vicinae/api";
import { define, initializeWordnet, WordDefinition } from "./word-definition";
import { suggestCorrections } from "./word-suggestion";
import { spawn } from 'node:child_process';

interface WordResult {
  word: string;
  definitions: WordDefinition[];
}

export default function ViewTranslate() {
  const [wordList, setWordList] = useState<string[]>([]);
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const [word, setWord] = useState("");
  const [definitions, setDefinitions] = useState<WordResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isShowingDetail, setIsShowingDetail] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const selectedText = await getSelectedText();
        if (!selectedText) return;
        setWord(selectedText);
      } catch (error) {
        console.log(`${error}`)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!word.trim()) {
      setWordList([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        console.log('run');


        const suggestions = await suggestCorrections(word, isDeepSearch);
        const definitionList = await getDefinitions(suggestions);
        console.log({ definitionList });

        setWordList(suggestions);
        setDefinitions(definitionList);
        clearSelection();
      } catch (error) {
        console.error("Spellcheck failed:", error);
        setWordList([]);
      } finally {
        setIsLoading(false)
      }
    }, 500);

    // Cancel the timer if the user types again.
    return () => clearTimeout(timeout);
  }, [word, isDeepSearch]);

  return (
    <List
      searchBarPlaceholder='Spell word...'
      searchText={word}
      isShowingDetail={isShowingDetail}
      onSearchTextChange={(text) => {
        setWord(text);
        setIsLoading(text ? true : false);
      }}
      navigationTitle={` ${wordList.length > 1 ? wordList.length + ' - Suggestions' : 'No suggestions'}`}
      isLoading={isLoading}>
      {wordList.map((suggestion, i) => {
        const definition = definitions?.find(w => w.word === suggestion);
        return (
          <List.Item title={suggestion} key={suggestion} icon={Icon.Hashtag}
            accessories={[
              { tag: definition?.definitions.length ? `${definition.definitions.length}` : undefined }
            ]}
            detail={
              <>
                {definition && (
                  <List.Item.Detail markdown={`# ${definition.word}\n\n${definition.definitions
                    .map(d => `Type: ${d.type}\n\nDefinition: ${d.definition}\n\n---\n\n`)
                    .join('')}`} />
                )}
              </>
            }
            subtitle={definition?.definitions[0]?.definition}
            actions={
              <ActionPanel>
                {suggestion !== word && (
                  <>
                    <Action.Paste title="Paste suggestion" content={`${word.split('')[0] === ' ' ? " " : ''}${suggestion}${word.split('')[word.length - 1] === ' ' ? " " : ''}`} />
                    <Action.CopyToClipboard content={`${suggestion}`} />
                    <Action shortcut={{ modifiers: ['ctrl'], key: 'e' }} title={`${isShowingDetail ? "Hide" : "Show"} details`} onAction={() => setIsShowingDetail(!isShowingDetail)} />
                    <Action shortcut={{ modifiers: ['ctrl'], key: 'o' }} title={`${isDeepSearch ? "Shrink" : "Extend"} suggestions`} onAction={() => setIsDeepSearch(!isDeepSearch)} />
                  </>
                )}
              </ActionPanel>
            } />
        )
      })}
    </List>
  );
}

async function clearSelection(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn('xclip', ['-selection', 'primary']);

    proc.on('error', (error: Error) => {
      reject(error);
    });

    proc.on('close', (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`xclip exited with code ${code}`));
      }
    });

    proc.stdin.end();
  });
}

async function getDefinitions(words: string[]) {
  try {
    await initializeWordnet();

    const output: WordResult[] = [];

    for (const word of words) {
      const definitions = await define(
        word.toLocaleLowerCase()
      );

      output.push({ word, definitions });
    }

    return output;
  } catch (error) {
    console.error("WordNet error:", error);
    return [];
  }
}