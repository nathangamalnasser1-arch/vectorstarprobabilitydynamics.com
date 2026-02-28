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

  function buildCards(trackElement, statusElement) {
    LETTERS.forEach((letter) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "letter-card";
      card.setAttribute("aria-label", `Letter ${letter}`);
      card.textContent = letter;

      card.addEventListener("click", () => {
        document
          .querySelectorAll(".letter-card.is-speaking")
          .forEach((element) => element.classList.remove("is-speaking"));
        card.classList.add("is-speaking");
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

  function start() {
    const lettersTrackElement = document.getElementById("lettersTrack");
    const animalTrackElement = document.getElementById("animalTrack");
    const statusElement = document.getElementById("statusText");

    if (!lettersTrackElement || !animalTrackElement || !statusElement) {
      return;
    }

    buildCards(lettersTrackElement, statusElement);
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
    getNextLetterIndex,
    isMobileSingleCardWidth,
    getAnimalSoundPhrase,
  };

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", start);
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
