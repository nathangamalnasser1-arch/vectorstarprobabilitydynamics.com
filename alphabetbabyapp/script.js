(function initLetterGame(globalScope) {
  const LETTERS = Array.from({ length: 26 }, (_, idx) =>
    String.fromCharCode(65 + idx)
  );
  const FARM_ANIMALS = [
    {
      name: "Horse",
      sound: "Neigh",
      image:
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='240'><rect width='100%25' height='100%25' fill='%23fff4e6'/><text x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='110'>🐴</text></svg>",
    },
    {
      name: "Cow",
      sound: "Moo",
      image:
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='240'><rect width='100%25' height='100%25' fill='%23e6fff4'/><text x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='110'>🐮</text></svg>",
    },
    {
      name: "Pig",
      sound: "Oink",
      image:
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='240'><rect width='100%25' height='100%25' fill='%23ffe6f5'/><text x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='110'>🐷</text></svg>",
    },
    {
      name: "Chicken",
      sound: "Cluck",
      image:
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='240'><rect width='100%25' height='100%25' fill='%23fffbe6'/><text x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='110'>🐔</text></svg>",
    },
    {
      name: "Sheep",
      sound: "Baa",
      image:
        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='240'><rect width='100%25' height='100%25' fill='%23edf2ff'/><text x='50%25' y='54%25' dominant-baseline='middle' text-anchor='middle' font-size='110'>🐑</text></svg>",
    },
  ];
  const BABY_SIZE_LEVELS = [1, 2, 3];
  const BABY_FUN_SOUNDS = ["laugh", "boing", "snap", "crackle", "pop"];
  let babyAudioContext = null;

  function getNextLetterIndex(currentIndex, direction, total) {
    if (total <= 0) {
      return -1;
    }
    const offset = direction === "previous" ? -1 : 1;
    return (currentIndex + offset + total) % total;
  }

  function isMobileSingleCardWidth(viewportWidth) {
    return Number.isFinite(viewportWidth) && viewportWidth <= 768;
  }

  function applyTrackMode(trackElement, viewportWidth) {
    const useMobileMode = isMobileSingleCardWidth(viewportWidth);
    trackElement.classList.toggle("is-mobile-single", useMobileMode);
  }

  function getAnimalSoundPhrase(animal) {
    return `${animal.name} says ${animal.sound}`;
  }

  function normalizeBabySizeLevel(level) {
    return BABY_SIZE_LEVELS.includes(level) ? level : BABY_SIZE_LEVELS[0];
  }

  function getNextBabySizeLevel(currentLevel) {
    const normalizedLevel = normalizeBabySizeLevel(currentLevel);
    const currentIndex = BABY_SIZE_LEVELS.indexOf(normalizedLevel);
    return BABY_SIZE_LEVELS[(currentIndex + 1) % BABY_SIZE_LEVELS.length];
  }

  function getRandomKidColor(randomNumberGenerator = Math.random) {
    const hue = Math.floor(randomNumberGenerator() * 360);
    const saturation = 72 + Math.floor(randomNumberGenerator() * 24);
    const lightness = 38 + Math.floor(randomNumberGenerator() * 20);
    return `hsl(${hue}deg ${saturation}% ${lightness}%)`;
  }

  function getRandomBabyMotion(randomNumberGenerator = Math.random) {
    const shiftX = Math.floor(randomNumberGenerator() * 37) - 18;
    const shiftY = Math.floor(randomNumberGenerator() * 29) - 14;
    const rotation = Math.floor(randomNumberGenerator() * 51) - 25;
    return {
      shiftX,
      shiftY,
      rotation,
    };
  }

  function getRandomBabySoundName(randomNumberGenerator = Math.random) {
    const randomIndex = Math.floor(randomNumberGenerator() * BABY_FUN_SOUNDS.length);
    return BABY_FUN_SOUNDS[randomIndex] || BABY_FUN_SOUNDS[0];
  }

  function getHapticPatternForBabySound(soundName) {
    const patterns = {
      laugh: [14, 18, 14],
      boing: [26],
      snap: [12],
      crackle: [8, 14, 8, 14, 8],
      pop: [18, 12, 30],
    };
    return patterns[soundName] || patterns.pop;
  }

  function triggerBabyHaptics(soundName, navigatorObject) {
    const sourceNavigator =
      navigatorObject ||
      (typeof navigator !== "undefined" ? navigator : null);
    if (
      !sourceNavigator ||
      typeof sourceNavigator.vibrate !== "function"
    ) {
      return false;
    }
    sourceNavigator.vibrate(getHapticPatternForBabySound(soundName));
    return true;
  }

  function getBabyAudioContext(windowObject) {
    const sourceWindow =
      windowObject || (typeof window !== "undefined" ? window : null);
    if (!sourceWindow) {
      return null;
    }
    const AudioContextCtor =
      sourceWindow.AudioContext || sourceWindow.webkitAudioContext;
    if (typeof AudioContextCtor !== "function") {
      return null;
    }
    if (!babyAudioContext) {
      babyAudioContext = new AudioContextCtor();
    }
    return babyAudioContext;
  }

  function createNoiseBuffer(audioContext, durationSeconds) {
    const frameCount = Math.max(1, Math.floor(audioContext.sampleRate * durationSeconds));
    const buffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i += 1) {
      channelData[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function playTone(audioContext, config) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.frequency, config.startAt);
    gainNode.gain.setValueAtTime(config.gain, config.startAt);
    gainNode.gain.exponentialRampToValueAtTime(0.001, config.startAt + config.duration);
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start(config.startAt);
    oscillator.stop(config.startAt + config.duration);
  }

  function playNoise(audioContext, config) {
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    source.buffer = createNoiseBuffer(audioContext, config.duration);
    gainNode.gain.setValueAtTime(config.gain, config.startAt);
    gainNode.gain.exponentialRampToValueAtTime(0.001, config.startAt + config.duration);
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    source.start(config.startAt);
    source.stop(config.startAt + config.duration);
  }

  function playBabySoundEffect(soundName, windowObject) {
    const audioContext = getBabyAudioContext(windowObject);
    if (!audioContext) {
      return false;
    }
    const now = audioContext.currentTime;

    if (soundName === "laugh") {
      playTone(audioContext, { type: "triangle", frequency: 640, gain: 0.05, duration: 0.07, startAt: now });
      playTone(audioContext, { type: "triangle", frequency: 710, gain: 0.05, duration: 0.07, startAt: now + 0.09 });
      playTone(audioContext, { type: "triangle", frequency: 790, gain: 0.05, duration: 0.08, startAt: now + 0.18 });
    } else if (soundName === "boing") {
      playTone(audioContext, { type: "sine", frequency: 280, gain: 0.08, duration: 0.24, startAt: now });
      playTone(audioContext, { type: "sine", frequency: 420, gain: 0.05, duration: 0.16, startAt: now + 0.02 });
    } else if (soundName === "snap") {
      playNoise(audioContext, { gain: 0.12, duration: 0.045, startAt: now });
    } else if (soundName === "crackle") {
      [0, 0.04, 0.08, 0.12].forEach((offset) => {
        playNoise(audioContext, { gain: 0.07, duration: 0.03, startAt: now + offset });
      });
    } else {
      playTone(audioContext, { type: "square", frequency: 520, gain: 0.06, duration: 0.06, startAt: now });
      playTone(audioContext, { type: "square", frequency: 690, gain: 0.05, duration: 0.07, startAt: now + 0.06 });
    }
    return true;
  }

  function playBabyInteractionEffects() {
    const soundName = getRandomBabySoundName();
    playBabySoundEffect(soundName);
    triggerBabyHaptics(soundName);
    return soundName;
  }

  function setBabySizeClass(card, sizeLevel) {
    BABY_SIZE_LEVELS.forEach((level) => {
      card.classList.remove(`baby-size-${level}`);
    });
    card.classList.add(`baby-size-${normalizeBabySizeLevel(sizeLevel)}`);
    card.dataset.babySize = String(normalizeBabySizeLevel(sizeLevel));
  }

  function resetBabyCardStyle(card) {
    BABY_SIZE_LEVELS.forEach((level) => {
      card.classList.remove(`baby-size-${level}`);
    });
    delete card.dataset.babySize;
    card.style.removeProperty("--baby-letter-color");
    card.style.removeProperty("--baby-motion-transform");
  }

  function canSpeak() {
    return (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof SpeechSynthesisUtterance !== "undefined"
    );
  }

  function speakText(text, statusElement, statusLabel) {
    if (!canSpeak()) {
      statusElement.textContent = "Audio is not available in this browser.";
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1.05;
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
    statusElement.textContent = `Now sounding: ${statusLabel}`;
  }

  function speakLetter(letter, statusElement) {
    speakText(letter, statusElement, letter);
  }

  function speakAnimal(animal, statusElement) {
    speakText(getAnimalSoundPhrase(animal), statusElement, getAnimalSoundPhrase(animal));
  }

  function buildCards(trackElement, statusElement, babyModeState) {
    LETTERS.forEach((letter) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "letter-card";
      card.setAttribute("aria-label", `Letter ${letter}`);
      const symbol = document.createElement("span");
      symbol.className = "letter-symbol";
      symbol.textContent = letter;
      card.appendChild(symbol);

      card.addEventListener("click", () => {
        document
          .querySelectorAll(".letter-card.is-speaking")
          .forEach((element) => element.classList.remove("is-speaking"));
        card.classList.add("is-speaking");
        if (babyModeState.enabled) {
          const currentSizeLevel = Number(card.dataset.babySize) || babyModeState.sizeLevel;
          const nextLevel = getNextBabySizeLevel(currentSizeLevel);
          const motion = getRandomBabyMotion();
          babyModeState.sizeLevel = nextLevel;
          setBabySizeClass(card, nextLevel);
          card.style.setProperty("--baby-letter-color", getRandomKidColor());
          card.style.setProperty(
            "--baby-motion-transform",
            `translate(${motion.shiftX}px, ${motion.shiftY}px) rotate(${motion.rotation}deg)`
          );
          playBabyInteractionEffects();
          babyModeState.sliderElement.value = String(nextLevel);
          babyModeState.sliderElement.setAttribute("aria-valuenow", String(nextLevel));
        }
        speakLetter(letter, statusElement);
      });

      trackElement.appendChild(card);
    });
  }

  function markSpeakingCard(nextCard, cardClassName) {
    document
      .querySelectorAll(`.${cardClassName}.is-speaking`)
      .forEach((element) => element.classList.remove("is-speaking"));
    nextCard.classList.add("is-speaking");
  }

  function buildAnimalCards(trackElement, statusElement) {
    let activeAnimalName = "";
    const cards = [];

    FARM_ANIMALS.forEach((animal) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "letter-card animal-card";
      card.setAttribute("aria-label", `${animal.name} image`);
      card.dataset.animalName = animal.name;

      const image = document.createElement("img");
      image.className = "animal-image";
      image.src = animal.image;
      image.alt = animal.name;

      const caption = document.createElement("span");
      caption.className = "animal-name";
      caption.textContent = animal.name;

      card.appendChild(image);
      card.appendChild(caption);

      const playAnimalSound = () => {
        if (activeAnimalName === animal.name) {
          return;
        }
        activeAnimalName = animal.name;
        markSpeakingCard(card, "animal-card");
        speakAnimal(animal, statusElement);
      };

      card.addEventListener("click", playAnimalSound);
      trackElement.appendChild(card);
      cards.push({ card, playAnimalSound });
    });

    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.72) {
            const hit = cards.find((item) => item.card === entry.target);
            if (hit) {
              hit.playAnimalSound();
            }
          }
        });
      },
      {
        root: trackElement,
        threshold: [0.72],
      }
    );

    cards.forEach((item) => observer.observe(item.card));
  }

  function setupTabs(statusElement) {
    const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
    const panels = Array.from(document.querySelectorAll(".lesson-panel"));

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetPanelId = button.dataset.panel;
        tabButtons.forEach((tabButton) => {
          const selected = tabButton === button;
          tabButton.classList.toggle("is-active", selected);
          tabButton.setAttribute("aria-selected", String(selected));
        });

        panels.forEach((panel) => {
          panel.hidden = panel.id !== targetPanelId;
        });

        if (targetPanelId === "lettersPanel") {
          statusElement.textContent = "Tap a letter to hear it.";
        } else {
          statusElement.textContent =
            "Swipe animals up and down. Sound plays automatically.";
        }
      });
    });
  }

  function setupBabyMode(trackElement, statusElement) {
    const toggleElement = document.getElementById("babyModeToggle");
    const sliderElement = document.getElementById("babySizeSlider");
    if (!toggleElement || !sliderElement) {
      return { enabled: false, sizeLevel: 1, sliderElement: { value: "1", setAttribute() {} } };
    }

    const babyModeState = {
      enabled: false,
      sizeLevel: normalizeBabySizeLevel(Number(sliderElement.value)),
      sliderElement,
    };
    const getCards = () => Array.from(trackElement.querySelectorAll(".letter-card"));

    const applyToAllCards = (colorize) => {
      getCards().forEach((card) => {
        setBabySizeClass(card, babyModeState.sizeLevel);
        if (colorize) {
          card.style.setProperty("--baby-letter-color", getRandomKidColor());
        }
      });
    };

    sliderElement.addEventListener("input", () => {
      babyModeState.sizeLevel = normalizeBabySizeLevel(Number(sliderElement.value));
      sliderElement.setAttribute("aria-valuenow", String(babyModeState.sizeLevel));
      if (babyModeState.enabled) {
        applyToAllCards(false);
        statusElement.textContent = `Baby mode letter size: level ${babyModeState.sizeLevel}.`;
      }
    });

    toggleElement.addEventListener("change", () => {
      babyModeState.enabled = toggleElement.checked;
      if (babyModeState.enabled) {
        applyToAllCards(true);
        statusElement.textContent =
          "Baby mode on! Tap letters for size, color, movement, sounds, and haptics.";
      } else {
        getCards().forEach(resetBabyCardStyle);
        statusElement.textContent = "Baby mode off. Tap a letter to hear it.";
      }
    });

    return babyModeState;
  }

  function start() {
    const lettersTrackElement = document.getElementById("lettersTrack");
    const animalTrackElement = document.getElementById("animalTrack");
    const statusElement = document.getElementById("statusText");

    if (!lettersTrackElement || !animalTrackElement || !statusElement) {
      return;
    }

    const babyModeState = setupBabyMode(lettersTrackElement, statusElement);
    buildCards(lettersTrackElement, statusElement, babyModeState);
    buildAnimalCards(animalTrackElement, statusElement);
    applyTrackMode(lettersTrackElement, window.innerWidth);
    applyTrackMode(animalTrackElement, window.innerWidth);
    setupTabs(statusElement);

    window.addEventListener("resize", () => {
      applyTrackMode(lettersTrackElement, window.innerWidth);
      applyTrackMode(animalTrackElement, window.innerWidth);
    });
  }

  globalScope.LetterGame = {
    LETTERS,
    FARM_ANIMALS,
    BABY_SIZE_LEVELS,
    BABY_FUN_SOUNDS,
    getNextLetterIndex,
    isMobileSingleCardWidth,
    getAnimalSoundPhrase,
    normalizeBabySizeLevel,
    getNextBabySizeLevel,
    getRandomKidColor,
    getRandomBabyMotion,
    getRandomBabySoundName,
    getHapticPatternForBabySound,
    triggerBabyHaptics,
  };

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", start);
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
