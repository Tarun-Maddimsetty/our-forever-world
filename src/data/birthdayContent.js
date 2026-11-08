/**
 * BIRTHDAY CONTENT & CINEMATIC SCRIPT
 * 
 * Edit this file to customize:
 * - The special birthday letter presented by the anime boy
 * - Climax dialogue, subtitles, and captions
 * - Audio file sources
 * - 3D Model file paths
 */

export const BIRTHDAY_CONTENT = {
  // Asset Paths (Place your custom files in public/assets/)
  assets: {
    femaleModel: "/assets/characters/female.glb",
    maleModel: "/assets/characters/male.glb",
    necklaceModel: "/assets/models/necklace.glb",
    bgMusic: "/assets/audio/background-music.mp3",
    voiceAudio: "/assets/audio/birthday-voice.mp3",
  },

  // Opening Screen Content
  opening: {
    headline: "OUR FOREVER WORLD",
    subheadline: "An Interactive Birthday Adventure for My Wife",
    welcomeText: "Welcome to a little world made only for you.",
    enterButtonText: "ENTER OUR WORLD ❤️",
    instructionsDesktop: "Use WASD or Arrow Keys to move • Mouse to look around • Press [E] to interact",
    instructionsMobile: "Use Joystick to move • Drag screen to look around • Tap interaction buttons",
  },

  // Museum Prompts
  museum: {
    photoHoverText: "A beautiful memory ❤️",
    readPromptDesktop: "Press [E] to read",
    readPromptMobile: "READ LETTER 💌",
    allMemoriesUnlockedBanner: "You have discovered every memory... but the most beautiful surprise is still waiting.",
    bedroomDoorHint: "One more surprise is waiting behind this door.",
    bedroomDoorButton: "OPEN THE DOOR ❤️",
    requireAllMemoriesToEnter: false, // Set to true if she must read all 7 before opening bedroom
  },

  // Bedroom Surprise Sequence
  bedroom: {
    maleGreetingBanner: "HAPPY BIRTHDAY, MY LOVE! ❤️",
    maleGreetingSubtitle: "I have been waiting here for you with all my love...",
    
    // Necklace Presentation
    necklaceIntro: "I wanted to give you something as precious and radiant as you are to me.",
    necklaceActionText: "Gently placing the birthday necklace...",
    necklaceSparkleText: "A token of my eternal love ✨",

    // Final Birthday Letter
    envelopePrompt: "I have something special to tell you...",
    letterButtonText: "READ BIRTHDAY LETTER 💌",
    
    // The actual birthday letter text
    birthdayLetter: {
      salutation: "To My Dearest, Most Beautiful Wife,",
      bodyParagraphs: [
        "Happy Birthday, my darling! On this special day, the whole universe celebrates the moment you came into this world, bringing warmth, kindness, and boundless joy to everyone lucky enough to know you—and most especially to me.",
        "Every single day I wake up knowing I am loved by you is the greatest privilege of my life. You make every ordinary day feel like an extraordinary blessing. In your eyes, I see my future, my sanctuary, and my peace.",
        "I built this world for you so that whenever distance or time feels heavy, you can step into this place and remember that my love for you is vast, unwavering, and forever. You are the light of my universe.",
        "May this new year of your life be filled with sweet surprises, laughter, overflowing love, and all the dreams your heart has ever wished for. I will be right here holding your hand, cheering for you, protecting you, and loving you more and more every single day.",
      ],
      closing: "With all my heart and my entire soul,",
      signature: "Your Loving Husband ❤️",
    },

    // Choices after reading the letter
    choices: {
      holdHand: "HOLD MY HAND ❤️",
      readAgain: "READ MY LETTER AGAIN 💌",
    },

    // Sitting on Bed & Voice Recording Scene
    bedScene: {
      title: "Our Peaceful Sanctuary",
      whisper: "Stay here with me. Listen closely to what my heart wants to say...",
      voiceTitle: "A Message Directly From My Heart",
      voiceSubtitle: "Press play to listen to my voice recording for you",
    },

    // Final Scene
    finalScene: {
      quotePart1: "Distance may keep us apart today, but nothing can keep our hearts apart.",
      quotePart2: "Happy Birthday, My Forever Love. ❤️",
      revisitButton: "REVISIT OUR MEMORIES ❤️",
    },
  },
};
