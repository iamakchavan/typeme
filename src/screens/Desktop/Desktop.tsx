import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Volume2, VolumeX, Keyboard, BarChart3, User } from "lucide-react";
import { useTypingResults } from "../../hooks/useTypingResults";
import { TypingStats } from "../../components/TypingStats";
import { UserSettings } from "../../components/UserSettings";
import { DebugSupabase } from "../../components/DebugSupabase";

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
  const [timerDuration, setTimerDuration] = useState(30);
  const [isActive, setIsActive] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isTimerHovered, setIsTimerHovered] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [textKey, setTextKey] = useState(0); // Key to trigger text transitions
  const [isRestarting, setIsRestarting] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  // Supabase integration
  const { saveResult, userProfile, loadLeaderboard, loadUserProfile } = useTypingResults();

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
    let interval: number | null = null;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Save the typing result when test completes
      saveTypingResult();
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  // Save typing result to Supabase
  const saveTypingResult = async () => {
    if (userInput.length === 0) return;

    try {
      const accuracy = (correctChars / userInput.length) * 100;
      const wordsTyped = Math.floor(correctChars / 5); // Standard: 5 characters = 1 word

      await saveResult({
        wpm,
        accuracy: Math.round(accuracy * 100) / 100, // Round to 2 decimal places
        testDuration: timerDuration,
        charactersTyped: userInput.length,
        correctCharacters: correctChars,
        wordsTyped,
        testType: 'timed'
      });
    } catch (error) {
      console.error('Failed to save typing result:', error);
      // Don't show error to user, just log it
    }
  };

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

    // Check if we need to generate more text (when user is near the end and timer is still running)
    if (isActive && timeLeft > 0 && value.length >= text.length - 20) {
      const additionalText = generateText(30);
      setText(prevText => prevText + " " + additionalText);
      // Don't trigger textKey change for text expansion - only for restart
    }

    setUserInput(value);
  };

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const elapsedMinutes = (timerDuration - timeLeft) / 60;
      if (elapsedMinutes > 0) {
        const calculatedWpm = Math.round((correctChars / 5) / elapsedMinutes);
        setWpm(calculatedWpm);
      }
    }
  }, [correctChars, timeLeft, isActive, timerDuration]);

  const handleRestart = () => {
    setIsRestarting(true);
    setText(generateText());
    setUserInput("");
    setTimeLeft(timerDuration);
    setIsActive(false);
    setWpm(0);
    setCorrectChars(0);
    setScrollOffset(0);
    setTextKey(prev => prev + 1); // Trigger text transition
    setTimeout(() => setIsRestarting(false), 100);
    inputRef.current?.focus();
  };

  const handleTimerClick = () => {
    if (!isActive) {
      const newDuration = timerDuration === 30 ? 60 : 30;
      setTimerDuration(newDuration);
      setTimeLeft(newDuration);
    }
  };

  // Break text into lines and create character mapping
  const getTextLinesWithMapping = () => {
    if (!textContainerRef.current) return { lines: [], charToLineMap: [] };

    const containerWidth = textContainerRef.current.offsetWidth;
    const charWidth = 16.8; // Approximate width of Inter font at 28px
    const charsPerLine = Math.floor(containerWidth / charWidth);

    const lines: string[] = [];
    const charToLineMap: number[] = []; // Maps each character index to its line number
    const words = text.split(' ');
    let currentLine = '';
    let currentLineIndex = 0;
    let globalCharIndex = 0;

    for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
      const word = words[wordIndex];
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= charsPerLine) {
        // Add space character mapping if not first word in line
        if (currentLine) {
          charToLineMap[globalCharIndex] = currentLineIndex;
          globalCharIndex++; // for the space
        }

        // Add word character mappings
        for (let i = 0; i < word.length; i++) {
          charToLineMap[globalCharIndex] = currentLineIndex;
          globalCharIndex++;
        }

        currentLine = testLine;
      } else {
        // Line is full, start new line
        if (currentLine) {
          lines.push(currentLine);
          currentLineIndex++;
        }

        // Add word character mappings to new line
        for (let i = 0; i < word.length; i++) {
          charToLineMap[globalCharIndex] = currentLineIndex;
          globalCharIndex++;
        }

        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return { lines, charToLineMap };
  };

  // Calculate which line the cursor is on
  const getCurrentLineIndex = () => {
    const { charToLineMap } = getTextLinesWithMapping();
    const cursorPosition = Math.min(userInput.length, charToLineMap.length - 1);
    return charToLineMap[cursorPosition] || 0;
  };

  // Update scroll offset when cursor moves to new lines - trigger earlier
  useEffect(() => {
    const currentLineIndex = getCurrentLineIndex();
    const maxVisibleLines = 3;

    // Trigger scroll when cursor reaches the 3rd line (index 2) instead of waiting for 4th line
    if (currentLineIndex >= maxVisibleLines - 1) {
      const newOffset = Math.max(0, currentLineIndex - maxVisibleLines + 2);
      if (newOffset !== scrollOffset) {
        setScrollOffset(newOffset);
      }
    }
  }, [userInput, text, scrollOffset]);

  const renderScrollingText = () => {
    const { lines } = getTextLinesWithMapping();
    const maxVisibleLines = 3;
    const visibleLines = lines.slice(scrollOffset, scrollOffset + maxVisibleLines);

    const cursorElement = (
      <motion.span
        layoutId={`cursor-${scrollOffset}`}
        className="inline-block w-[2px] h-[1.2em] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)] align-baseline relative top-[0.1em]"
        animate={{
          opacity: [0.3, 1, 0.6, 1, 0.3],
          scaleY: [0.95, 1.05, 0.98, 1.02, 0.95],
          y: [1.5, -0.5, 0.8, -0.2, 1.5],
          scaleX: [1, 0.8, 1.1, 0.9, 1],
          boxShadow: [
            "0 0 6px rgba(255,255,255,0.2)",
            "0 0 20px rgba(255,255,255,0.9)",
            "0 0 12px rgba(255,255,255,0.6)",
            "0 0 16px rgba(255,255,255,0.8)",
            "0 0 6px rgba(255,255,255,0.2)"
          ],
          filter: [
            "blur(0px) brightness(0.9)",
            "blur(0.8px) brightness(1.3)",
            "blur(0.3px) brightness(1.1)",
            "blur(0.6px) brightness(1.25)",
            "blur(0px) brightness(0.9)"
          ]
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
          duration: 2.2,
          repeat: Infinity,
          ease: [0.45, 0.05, 0.55, 0.95],
          times: [0, 0.25, 0.5, 0.75, 1]
        }}
      />
    );

    return (
      <motion.div
        key={isRestarting ? textKey : 'stable'}
        initial={isRestarting ? {
          y: 15,
          opacity: 0.5,
          filter: "blur(8px)",
          scale: 0.96
        } : false}
        animate={{
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          scale: 1
        }}
        transition={isRestarting ? {
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1]
        } : {
          duration: 0.2,
          ease: [0.16, 1, 0.3, 1]
        }}
      >
        {visibleLines.map((line, lineIndex) => {
          const actualLineIndex = scrollOffset + lineIndex;

          const renderLine = () => {
            const elements: JSX.Element[] = [];
            let globalCharIndex = 0;

            // Calculate the global character index for this line
            for (let i = 0; i < actualLineIndex; i++) {
              globalCharIndex += lines[i].length;
              if (i < lines.length - 1) globalCharIndex++; // Add space between lines
            }

            // Render each character in the line
            for (let charIndex = 0; charIndex < line.length; charIndex++) {
              const char = line[charIndex];
              const currentGlobalIndex = globalCharIndex + charIndex;

              // Add cursor if it's at this position
              if (currentGlobalIndex === userInput.length) {
                elements.push(<span key={`cursor-${currentGlobalIndex}`}>{cursorElement}</span>);
              }

              let className = "text-[#4e4e4e]";
              let isCorrect = false;
              let isError = false;

              if (currentGlobalIndex < userInput.length) {
                if (userInput[currentGlobalIndex] === char) {
                  className = "text-white";
                  isCorrect = true;
                } else {
                  className = "text-red-500";
                  isError = true;
                }
              }

              elements.push(
                <motion.span
                  key={currentGlobalIndex}
                  className={className}
                  initial={isCorrect ? {
                    scale: 1.05,
                    filter: "blur(1px)"
                  } : {}}
                  animate={isCorrect ? {
                    scale: 1,
                    filter: "blur(0px)",
                    textShadow: [
                      "0 0 0px rgba(255,255,255,0)",
                      "0 0 16px rgba(255,255,255,0.9)",
                      "0 0 8px rgba(255,255,255,0.4)",
                      "0 0 0px rgba(255,255,255,0)"
                    ]
                  } : isError ? {
                    scale: [1, 1.02, 1],
                    filter: ["blur(0px)", "blur(0.5px)", "blur(0px)"]
                  } : {}}
                  style={isError ? {
                    textShadow: "0 0 12px rgba(239, 68, 68, 0.8)"
                  } : {}}
                  transition={{
                    duration: isCorrect ? 0.8 : 0.3,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                >
                  {char}
                </motion.span>
              );
            }

            // Add cursor at end of line if needed (for spaces between lines)
            const lineEndIndex = globalCharIndex + line.length;
            if (lineEndIndex === userInput.length && actualLineIndex < lines.length - 1) {
              elements.push(<span key={`cursor-end-${lineEndIndex}`}>{cursorElement}</span>);
            }

            return elements;
          };

          return (
            <motion.div
              key={`line-${actualLineIndex}`}
              className="leading-[42px]"
              initial={isRestarting ? {
                opacity: 0,
                y: 15,
                filter: "blur(5px)",
                scale: 0.97
              } : false}
              animate={{
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                scale: 1
              }}
              transition={isRestarting ? {
                duration: 0.5,
                delay: lineIndex * 0.1,
                ease: [0.16, 1, 0.3, 1]
              } : {
                duration: 0.2,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              {renderLine()}
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  return (
    <motion.div
      className="bg-black w-full h-screen flex items-center justify-center p-8 overflow-hidden relative"
      initial={{
        opacity: 0,
        filter: "blur(12px) saturate(0.8)",
        scale: 1.03,
        rotateX: 2
      }}
      animate={{
        opacity: 1,
        filter: "blur(0px) saturate(1)",
        scale: 1,
        rotateX: 0
      }}
      transition={{
        duration: 1.8,
        ease: [0.16, 1, 0.3, 1],
        delay: 0.1
      }}
    >
      {/* Ambient background glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-white/[0.02] via-transparent to-transparent"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 2.5,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.8
        }}
      />
      <motion.div
        className="flex flex-col w-full max-w-4xl gap-16 relative z-10"
        initial={{
          y: 30,
          opacity: 0,
          filter: "blur(6px)",
          scale: 0.98
        }}
        animate={{
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          scale: 1
        }}
        transition={{
          duration: 1.4,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.4
        }}
      >
        <motion.header
          className="flex items-center justify-between font-['Inter'] font-normal text-white text-3xl tracking-wide"
          initial={{
            y: -30,
            opacity: 0,
            filter: "blur(8px)",
            scale: 0.95
          }}
          animate={{
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            scale: 1
          }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.6
          }}
        >
          <motion.div
            className="flex items-center gap-3"
            initial={{ x: -20, opacity: 0, filter: "blur(4px)" }}
            animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
            transition={{
              duration: 1,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.8
            }}
          >
            <motion.div
              whileHover={{
                scale: 1.1,
                rotate: 5,
                filter: "brightness(1.2)"
              }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Keyboard size={32} className="text-white/50" />
            </motion.div>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                delay: 1
              }}
            >
              typeme
            </motion.span>
          </motion.div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setShowSettings(true)}
              className="text-white/50 hover:text-white transition-all duration-300 p-2 rounded-lg relative"
              aria-label="Profile"
              initial={{ x: 20, opacity: 0, filter: "blur(4px)" }}
              animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
              whileHover={{
                scale: 1.1,
                backgroundColor: "rgba(255,255,255,0.05)",
                filter: "blur(0px) brightness(1.2)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              <User size={20} />
              {userProfile?.display_name && (
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 }}
                />
              )}
            </motion.button>

            <motion.button
              onClick={() => setShowStats(true)}
              className="text-white/50 hover:text-white transition-all duration-300 p-2 rounded-lg relative"
              aria-label="View stats"
              initial={{ x: 20, opacity: 0, filter: "blur(4px)" }}
              animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
              whileHover={{
                scale: 1.1,
                backgroundColor: "rgba(255,255,255,0.05)",
                filter: "blur(0px) brightness(1.2)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              <BarChart3 size={20} />
              {userProfile && (
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 }}
                />
              )}
            </motion.button>

            <motion.button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className="text-white/50 hover:text-white transition-all duration-300 p-2 rounded-lg"
              aria-label={isSoundEnabled ? "Mute sound" : "Unmute sound"}
              initial={{ x: 20, opacity: 0, filter: "blur(4px)" }}
              animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
              whileHover={{
                scale: 1.1,
                backgroundColor: "rgba(255,255,255,0.05)",
                filter: "blur(0px) brightness(1.2)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              <motion.div
                animate={isSoundEnabled ? {} : { rotate: 180 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {isSoundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </motion.div>
            </motion.button>
          </div>
        </motion.header>

        <motion.main
          className="relative font-['Inter'] font-normal text-[28px] tracking-wide select-none"
          initial={{
            y: 25,
            opacity: 0,
            filter: "blur(10px)",
            scale: 0.97
          }}
          animate={{
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            scale: 1
          }}
          transition={{
            duration: 1.3,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.9
          }}
        >
          <motion.div
            ref={textContainerRef}
            className="overflow-hidden text-left h-[126px] relative rounded-lg" // Fixed height for 3 lines (42px * 3)
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)',
              backdropFilter: 'blur(0.5px)'
            }}
            initial={{
              opacity: 0,
              filter: "blur(6px)",
              scale: 0.98
            }}
            animate={{
              opacity: 1,
              filter: "blur(0px)",
              scale: 1
            }}
            transition={{
              duration: 1.1,
              ease: [0.16, 1, 0.3, 1],
              delay: 1.1
            }}
          >
            <AnimatePresence mode="wait">
              {renderScrollingText()}
            </AnimatePresence>
          </motion.div>
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
          initial={{
            y: 30,
            opacity: 0,
            filter: "blur(8px)",
            scale: 0.95
          }}
          animate={{
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            scale: 1
          }}
          transition={{
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
            delay: 1.3
          }}
        >
          <div className="relative">
            <motion.button
              onClick={handleTimerClick}
              onMouseEnter={() => setIsTimerHovered(true)}
              onMouseLeave={() => setIsTimerHovered(false)}
              disabled={isActive}
              className={`font-['Inter'] font-normal text-[28px] tracking-wide whitespace-nowrap transition-colors duration-200 ${isActive
                ? 'text-white cursor-default'
                : 'text-white hover:text-white/80 cursor-pointer'
                }`}
              whileHover={!isActive ? { scale: 1.02 } : {}}
              transition={{ duration: 0.2 }}
            >
              <motion.span
                key={timerDuration}
                initial={{
                  opacity: 0,
                  filter: "blur(6px)",
                  y: -8,
                  scale: 0.9
                }}
                animate={{
                  opacity: 1,
                  filter: "blur(0px)",
                  y: 0,
                  scale: 1
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1]
                }}
              >
                {timeLeft}s
              </motion.span>
            </motion.button>

            {/* Hover dropdown */}
            <motion.div
              className="absolute top-full left-0 mt-2 pointer-events-none"
              initial={{
                opacity: 0,
                y: -15,
                filter: "blur(6px)",
                scale: 0.9
              }}
              animate={{
                opacity: isTimerHovered && !isActive ? 1 : 0,
                y: isTimerHovered && !isActive ? 0 : -15,
                filter: isTimerHovered && !isActive ? "blur(0px)" : "blur(6px)",
                scale: isTimerHovered && !isActive ? 1 : 0.9
              }}
              transition={{
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              <div className="font-['Inter'] font-normal text-white/60 text-[20px] tracking-wide whitespace-nowrap">
                {timerDuration === 30 ? '60s' : '30s'}
              </div>
            </motion.div>
          </div>
          <div className="font-['Inter'] font-normal text-white text-[28px] tracking-wide whitespace-nowrap">
            {wpm}wpm
            {userProfile && userProfile.best_wpm > 0 && (
              <motion.div
                className="text-[14px] text-white/40 mt-1 space-y-1"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div>best: {userProfile.best_wpm}</div>
                {userProfile.display_name && (
                  <div className="text-[12px] text-white/30">
                    {userProfile.display_name}
                  </div>
                )}
              </motion.div>
            )}
          </div>
          <motion.div
            whileHover={{
              scale: 1.05,
              filter: "blur(0px) brightness(1.1)"
            }}
            whileTap={{
              scale: 0.95,
              filter: "blur(0.5px)"
            }}
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            <Button
              variant="ghost"
              onClick={handleRestart}
              className={`font-['Inter'] font-normal text-[28px] tracking-wide whitespace-nowrap h-auto p-0 hover:bg-transparent transition-colors duration-300 ${timeLeft === 0 ? 'text-green-500 hover:text-green-400' : 'text-white hover:text-white/90'
                }`}
            >
              <motion.span
                animate={timeLeft === 0 ? {
                  textShadow: [
                    "0 0 0px rgba(34,197,94,0)",
                    "0 0 12px rgba(34,197,94,0.6)",
                    "0 0 0px rgba(34,197,94,0)"
                  ]
                } : {}}
                transition={{
                  duration: 2,
                  repeat: timeLeft === 0 ? Infinity : 0,
                  ease: [0.16, 1, 0.3, 1]
                }}
              >
                restart
              </motion.span>
            </Button>
          </motion.div>
        </motion.footer>
      </motion.div>

      <AnimatePresence>
        <TypingStats isVisible={showStats} onClose={() => setShowStats(false)} />
      </AnimatePresence>
      
      <AnimatePresence>
        <UserSettings 
          isVisible={showSettings} 
          onClose={() => setShowSettings(false)}
          onDisplayNameUpdate={async () => {
            // Refresh user profile and leaderboard after display name update
            await loadUserProfile()
            await loadLeaderboard()
          }}
        />
      </AnimatePresence>
      
      <DebugSupabase />
    </motion.div>
  );
};
