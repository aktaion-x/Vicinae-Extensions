
import { useEffect, useState } from "react";
import translate from "google-translate-extended-api";
import { Detail } from "@vicinae/api";

export default function ViewTranslate() {
  const [translation, setTranslation] = useState("Loading...");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const word = "console";
        console.log(word);

        const response = await translate(word, "en", "ar");

        if (cancelled) return;

        setTranslation(
          `****\n\n` +
          `**Translation:**` +
          `**Detected language:**`
        );
      } catch (error: unknown) {
        console.error("Dictionary lookup failed:", error);

        if (!cancelled) {
          setTranslation(
            "Translation failed. Check the network connection and try again."
          );
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return <Detail markdown={translation} />;
}

async function main(text: string) {
  try {
    const result = await translate(text, 'en', 'ar');
    console.log({ result });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Name:", error.name);
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }

    console.dir(error, { depth: 10 }); throw (error);
  }
}