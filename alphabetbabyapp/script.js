(function initLetterGame(globalScope) {
  const LETTERS = Array.from({ length: 26 }, (_, idx) =>
    String.fromCharCode(65 + idx)
  );

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

  function canSpeak() {
    return (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      typeof SpeechSynthesisUtterance !== "undefined"
    );
  }

  function speakLetter(letter, statusElement) {
    if (!canSpeak()) {
      statusElement.textContent = "Audio is not available in this browser.";
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(letter);
    utterance.rate = 0.8;
    utterance.pitch = 1.05;
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
    statusElement.textContent = `Now sounding: ${letter}`;
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

  function start() {
    const trackElement = document.getElementById("lettersTrack");
    const statusElement = document.getElementById("statusText");

    if (!trackElement || !statusElement) {
      return;
    }

    buildCards(trackElement, statusElement);
    applyTrackMode(trackElement, window.innerWidth);

    window.addEventListener("resize", () => {
      applyTrackMode(trackElement, window.innerWidth);
    });
  }

  globalScope.LetterGame = {
    LETTERS,
    getNextLetterIndex,
    isMobileSingleCardWidth,
  };

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", start);
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
