import React from 'react';
import { motion } from 'motion/react';

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  interactive?: boolean;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
}

const letterVariants = {
  hidden: { opacity: 0, y: 16, rotateX: 45 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.45,
      delay: i * 0.022,
      ease: [0.23, 1, 0.32, 1]
    }
  })
};

const hoverLetterVariants = {
  hover: {
    y: -4,
    scale: 1.12,
    color: 'var(--color-primario)',
    transition: { type: 'spring', stiffness: 500, damping: 12 }
  }
};

export default function AnimatedText({
  text,
  className = '',
  delay = 0,
  interactive = true,
  tag = 'span'
}: AnimatedTextProps) {
  const words = text.split(' ');
  let charCounter = 0;

  const Tag = tag as any;

  return (
    <Tag className={`inline select-text ${className}`}>
      {words.map((word, wordIndex) => {
        const letters = Array.from(word);
        const wordStartIndex = charCounter;
        charCounter += letters.length + 1;

        return (
          <React.Fragment key={`word-${wordIndex}-${word}`}>
            <span className="inline-block whitespace-nowrap">
              {letters.map((char, charIndex) => (
                <motion.span
                  key={`char-${wordIndex}-${charIndex}-${char}`}
                  custom={wordStartIndex + charIndex + delay * 10}
                  initial="hidden"
                  animate="visible"
                  variants={letterVariants}
                  whileHover={interactive ? hoverLetterVariants.hover : undefined}
                  className="inline-block transition-colors duration-150"
                >
                  {char}
                </motion.span>
              ))}
            </span>
            {wordIndex < words.length - 1 && <span className="inline-block">&nbsp;</span>}
          </React.Fragment>
        );
      })}
    </Tag>
  );
}
