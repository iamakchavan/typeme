import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Volume2, VolumeX, Keyboard } from "lucide-react";

const WORDS = [
  "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog",
  "hello", "world", "code", "type", "fast", "slow", "good", "bad",
  "night", "day", "sun", "moon", "star", "sky", "tree", "leaf",
  "water", "fire", "earth", "wind", "light", "dark", "time", "space",
  "love", "hate", "happy", "sad", "big", "small", "new", "old",
  "yes", "no", "maybe", "never", "always", "sometimes", "often", "rarely"
];

const generateText = (wordCount: number = 50): string => {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }
  return words.join(" ").trim();
};

export const Desktop = (): JSX.Element => {
  const [text, setText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setText(generateText());
    inputRef.current?.focus();

    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const playKeySound = (type: 'correct' | 'error' | 'backspace') => {
    if (!audioContextRef.current || !isSoundEnabled) return;

    const audioContext = audioContextRef.current;

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const now = audioContext.currentTime;
    oscillator.start(now);

    if (type === 'correct') {
      oscillator.frequency.value = 800 + Math.random() * 100;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.03, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      oscillator.stop(now + 0.05);
    } else if (type === 'error') {
      oscillator.frequency.value = 300;
      oscillator.type = 'triangle';
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      oscillator.stop(now + 0.08);
    } else if (type === 'backspace') {
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.02, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      oscillator.stop(now + 0.04);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value.length > userInput.length) {
      const lastCharIndex = value.length - 1;
      const isCorrect = value[lastCharIndex] === text[lastCharIndex];
      playKeySound(isCorrect ? 'correct' : 'error');

      if (isCorrect) {
        setCorrectChars(prev => prev + 1);
      }
    } else if (value.length < userInput.length) {
      playKeySound('backspace');

      const removedCharIndex = value.length;
      if (userInput[removedCharIndex] === text[removedCharIndex]) {
        setCorrectChars(prev => prev - 1);
      }
    }

    if (!isActive && value.length > 0) {
      setIsActive(true);
    }

    setUserInput(value);
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const elapsedMinutes = (30 - timeLeft) / 60;
      if (elapsedMinutes > 0) {
        const calculatedWpm = Math.round((correctChars / 5) / elapsedMinutes);
        setWpm(calculatedWpm);
      }
    }
  }, [correctChars, timeLeft, isActive]);

  const handleRestart = () => {
    setText(generateText());
    setUserInput("");
    setTimeLeft(30);
    setIsActive(false);
    setWpm(0);
    setCorrectChars(0);
    inputRef.current?.focus();
  };

  const renderText = () => {
    const cursorElement = (
      <motion.span
        layoutId="cursor"
        className="inline-block w-[2px] h-[1.2em] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] align-baseline relative top-[0.1em]"
        animate={{
          opacity: [0.5, 1, 0.5],
          scaleY: [0.98, 1, 0.98],
          y: [0.5, 0, 0.5]
        }}
        transition={{
          layout: {
            type: "spring",
            stiffness: 400,
            damping: 35,
            mass: 0.5,
            restDelta: 0.001,
            restSpeed: 0.001
          },
          opacity: {
            duration: 1.2,
            repeat: Infinity,
            ease: [0.45, 0.05, 0.55, 0.95]
          },
          scaleY: {
            duration: 1.2,
            repeat: Infinity,
            ease: [0.45, 0.05, 0.55, 0.95]
          },
          y: {
            duration: 1.2,
            repeat: Infinity,
            ease: [0.45, 0.05, 0.55, 0.95]
          }
        }}
      />
    );

    const elements: JSX.Element[] = [];
    let wordChars: JSX.Element[] = [];
    let wordKey = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (i === userInput.length) {
        wordChars.push(<span key="cursor">{cursorElement}</span>);
      }

      if (char === " ") {
        let spaceClassName = "text-[#4e4e4e]";
        let isCorrect = false;
        if (i < userInput.length) {
          if (userInput[i] === " ") {
            spaceClassName = "text-white";
            isCorrect = true;
          } else {
            spaceClassName = "text-red-500";
          }
        }

        const isError = i < userInput.length && userInput[i] !== " ";
        const spaceElement = (
          <span key={i} className="inline-block min-w-[0.5ch]">
            <motion.span
              className={spaceClassName}
              animate={isCorrect ? {
                textShadow: [
                  "0 0 0px rgba(255,255,255,0)",
                  "0 0 12px rgba(255,255,255,0.8)",
                  "0 0 0px rgba(255,255,255,0)"
                ]
              } : {}}
              style={isError ? {
                textShadow: "0 0 8px rgba(239, 68, 68, 0.7)"
              } : {}}
              transition={{
                duration: 0.6,
                ease: [0.45, 0.05, 0.55, 0.95]
              }}
            >
              {" "}
            </motion.span>
          </span>
        );

        wordChars.push(spaceElement);

        if (wordChars.length > 0) {
          elements.push(
            <span key={`word-${wordKey}`} className="whitespace-nowrap inline-block">
              {wordChars}
            </span>
          );
          wordChars = [];
          wordKey = i + 1;
        }
      } else {
        let className = "text-[#4e4e4e]";
        let isCorrect = false;
        let isError = false;
        if (i < userInput.length) {
          if (userInput[i] === char) {
            className = "text-white";
            isCorrect = true;
          } else {
            className = "text-red-500";
            isError = true;
          }
        }

        const charElement = (
          <span key={i} className="inline-block">
            <motion.span
              className={className}
              animate={isCorrect ? {
                textShadow: [
                  "0 0 0px rgba(255,255,255,0)",
                  "0 0 12px rgba(255,255,255,0.8)",
                  "0 0 0px rgba(255,255,255,0)"
                ]
              } : {}}
              style={isError ? {
                textShadow: "0 0 8px rgba(239, 68, 68, 0.7)"
              } : {}}
              transition={{
                duration: 0.6,
                ease: [0.45, 0.05, 0.55, 0.95]
              }}
            >
              {char}
            </motion.span>
          </span>
        );

        wordChars.push(charElement);
      }
    }

    if (wordChars.length > 0) {
      elements.push(
        <span key={`word-${wordKey}`} className="whitespace-nowrap inline-block">
          {wordChars}
        </span>
      );
    }

    return elements;
  };

  return (
    <motion.div 
      className="bg-black w-full h-screen flex items-center justify-center p-8 overflow-hidden"
      initial={{ 
        opacity: 0, 
        filter: "blur(8px)",
        scale: 1.02
      }}
      animate={{ 
        opacity: 1, 
        filter: "blur(0px)",
        scale: 1
      }}
      transition={{ 
        duration: 1.2,
        ease: [0.25, 0.1, 0.25, 1],
        delay: 0.1
      }}
    >
      <motion.div 
        className="flex flex-col w-full max-w-4xl gap-16"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          duration: 1,
          ease: [0.25, 0.1, 0.25, 1],
          delay: 0.3
        }}
      >
        <motion.header 
          className="flex items-center justify-between font-['Inter'] font-normal text-white text-3xl tracking-wide"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.5
          }}
        >
          <div className="flex items-center gap-3">
            <Keyboard size={32} className="text-white/50" />
            <span>typeme</span>
          </div>
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="text-white/50 hover:text-white transition-colors duration-200 p-2"
            aria-label={isSoundEnabled ? "Mute sound" : "Unmute sound"}
          >
            {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </motion.header>

        <motion.main 
          className="relative font-['Inter'] font-normal text-[28px] tracking-wide leading-[42px] select-none"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.7
          }}
        >
          <div className="overflow-hidden text-left">
            {renderText()}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInput}
            disabled={timeLeft === 0}
            className="absolute inset-0 w-full h-full opacity-0 cursor-default"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </motion.main>

        <motion.footer 
          className="flex items-center gap-12"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.9
          }}
        >
          <div className="font-['Inter'] font-normal text-white text-[28px] tracking-wide whitespace-nowrap">
            {timeLeft}s
          </div>
          <div className="font-['Inter'] font-normal text-white text-[28px] tracking-wide whitespace-nowrap">
            {wpm}wpm
          </div>
          <Button
            variant="ghost"
            onClick={handleRestart}
            className={`font-['Inter'] font-normal text-[28px] tracking-wide whitespace-nowrap h-auto p-0 hover:bg-transparent transition-colors duration-200 ${
              timeLeft === 0 ? 'text-green-500 hover:text-green-400' : 'text-white hover:text-white/80'
            }`}
          >
            restart
          </Button>
        </motion.footer>
      </motion.div>
    </motion.div>
  );
};
