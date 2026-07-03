'use client';

import { useState, useEffect, useRef } from 'react';

export function useTypewriterPlaceholder(
  strings,
  typingSpeed = 60,
  deletingSpeed = 30,
  delayBetween = 2500 // 2.5 seconds hold time
) {
  const [text, setText] = useState('');
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  // Store strings in a ref so changes to the array reference don't reset the typing timer
  const stringsRef = useRef(strings);
  useEffect(() => {
    stringsRef.current = strings;
  }, [strings]);

  useEffect(() => {
    let timer;
    const currentStrings = stringsRef.current;
    if (currentStrings.length === 0) return;

    const currentFullText = currentStrings[index % currentStrings.length];

    if (!isDeleting) {
      if (text === currentFullText) {
        // Fully typed: wait before deleting
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, delayBetween);
      } else {
        // Typing characters
        timer = setTimeout(() => {
          setText(currentFullText.substring(0, text.length + 1));
        }, typingSpeed);
      }
    } else {
      if (text === '') {
        // Fully deleted: switch to the next text in list
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % currentStrings.length);
      } else {
        // Deleting characters
        timer = setTimeout(() => {
          setText(currentFullText.substring(0, text.length - 1));
        }, deletingSpeed);
      }
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, index, typingSpeed, deletingSpeed, delayBetween]);

  // Blinking animation for the cursor
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 550);
    return () => clearInterval(cursorInterval);
  }, []);

  return text + (showCursor ? '|' : ' ');
}
