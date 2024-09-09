import { useEffect, useState } from "react";

const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    if (!navigator.clipboard) {
      console.warn("Copy to clipboard failed as API is not supported");
    } else {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopied(true);
        })
        .catch((err) => {
          console.error("Failed to copy text to clipboard.", err);
        });
    }
  };

  useEffect(() => {
    let interval = setInterval(() => {
      setCopied(false);
    }, 1000);

    return () => clearInterval(interval);
  }, [copied]);

  return { copied, copyToClipboard };
};

export default useCopyToClipboard;
