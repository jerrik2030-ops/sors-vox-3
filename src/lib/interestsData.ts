export interface InterestCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  topics: string[];
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'tech',
    name: 'Tech & Digital',
    emoji: '💻',
    description: 'Coding, artificial intelligence, gadgets, and startups',
    topics: [
      'Artificial Intelligence',
      'Software Engineering',
      'Web Development',
      'Cybersecurity',
      'Startups & Tech',
      'Gadgets & Hardware',
      'Crypto & Web3',
      'Mobile Apps'
    ]
  },
  {
    id: 'gaming',
    name: 'Gaming & Esports',
    emoji: '🎮',
    description: 'PC, console, indie gems, and competitive tournaments',
    topics: [
      'PC Gaming',
      'PlayStation / Xbox',
      'Nintendo & Switch',
      'Indie Games',
      'Esports & Competitive',
      'RPG & Open World',
      'Multiplayer & FPS',
      'Retro Gaming'
    ]
  },
  {
    id: 'cinema',
    name: 'Cinema & TV',
    emoji: '🎬',
    description: 'Movies, binge-worthy series, anime, and storytelling',
    topics: [
      'Cinema & Film',
      'Anime & Manga',
      'TV Shows & Series',
      'Sci-Fi & Fantasy',
      'Marvel & DC',
      'Documentaries',
      'Horror & Thrillers',
      'Classic Movies'
    ]
  },
  {
    id: 'music',
    name: 'Music & Audio',
    emoji: '🎵',
    description: 'Genres, instruments, live concerts, and playlists',
    topics: [
      'Rock & Alternative',
      'Hip-Hop & R&B',
      'Electronic & House',
      'Indie & Lo-Fi',
      'Pop Music',
      'Classical & Jazz',
      'Playing Instruments',
      'Music Production'
    ]
  },
  {
    id: 'science',
    name: 'Science & Cosmos',
    emoji: '🔭',
    description: 'Space exploration, physics, biology, and the unknown',
    topics: [
      'Space & Astronomy',
      'Physics & Math',
      'Biology & Nature',
      'Neuroscience',
      'History & Civilizations',
      'Climate & Ecology'
    ]
  },
  {
    id: 'philosophy',
    name: 'Philosophy & Mind',
    emoji: '🧠',
    description: 'Deep discussions, psychology, ethics, and big questions',
    topics: [
      'Deep Conversations',
      'Philosophy & Ethics',
      'Psychology',
      'Late Night Thoughts',
      'Self-Improvement',
      'Debates & Perspectives'
    ]
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle & Travel',
    emoji: '✈️',
    description: 'Wanderlust, delicious food, photography, and everyday life',
    topics: [
      'Travel & Backpacking',
      'Food & Cooking',
      'Photography',
      'Language Exchange',
      'Books & Literature',
      'Fitness & Gym',
      'Outdoor Adventures',
      'Pets & Animals'
    ]
  },
  {
    id: 'creative',
    name: 'Creative & Art',
    emoji: '🎨',
    description: 'Visual arts, graphic design, writing, and crafts',
    topics: [
      'Digital Art & Design',
      'Creative Writing',
      'Filmmaking & Video',
      'Fashion & Aesthetics',
      'Architecture',
      'Crafts & DIY'
    ]
  }
];

export const POPULAR_PRESET_PACKS = [
  {
    id: 'gamer',
    name: 'Gamer & Streamer',
    emoji: '🕹️',
    interests: ['PC Gaming', 'Indie Games', 'Esports & Competitive', 'Anime & Manga']
  },
  {
    id: 'techie',
    name: 'Tech & Future',
    emoji: '⚡',
    interests: ['Artificial Intelligence', 'Software Engineering', 'Space & Astronomy', 'Startups & Tech']
  },
  {
    id: 'creative_soul',
    name: 'Creative Soul',
    emoji: '✨',
    interests: ['Digital Art & Design', 'Indie & Lo-Fi', 'Cinema & Film', 'Photography']
  },
  {
    id: 'deep_talker',
    name: 'Deep Thinker',
    emoji: '🌌',
    interests: ['Deep Conversations', 'Philosophy & Ethics', 'Space & Astronomy', 'Late Night Thoughts']
  }
];

// Icebreaker generator based on topics
export const TOPIC_ICEBREAKERS: Record<string, string[]> = {
  'Artificial Intelligence': [
    'What AI tool or experiment has blown your mind most lately?',
    'Do you think AI will create art with real human emotion someday?'
  ],
  'Software Engineering': [
    'What is your favorite stack to build with right now?',
    'What was the weirdest bug you ever had to hunt down?'
  ],
  'PC Gaming': [
    'What game currently has you hooked?',
    'If you had to pick one game to play for the next 5 years, what is it?'
  ],
  'Indie Games': [
    'What is the most underrated indie game you have ever played?',
    'Do you prefer story-driven indie games or roguelikes?'
  ],
  'Cinema & Film': [
    'What movie did you watch that completely left you speechless?',
    'Who is your favorite movie director of all time?'
  ],
  'Anime & Manga': [
    'What is your all-time favorite anime series?',
    'What are you watching this season?'
  ],
  'Space & Astronomy': [
    'Would you take a trip to Mars if you had the opportunity?',
    'What space mystery fascinates you the most?'
  ],
  'Deep Conversations': [
    'What is a belief you held strongly five years ago that you changed your mind about?',
    'What is something you wish people talked about more often?'
  ],
  'Music & Audio': [
    'What album do you consider a 10/10 with zero skips?',
    'What was the best live concert you ever attended?'
  ],
  'Travel & Backpacking': [
    'What place that you visited surprised you the most?',
    'What is the top destination on your bucket list right now?'
  ],
  'Food & Cooking': [
    'What is your signature dish to cook when you want to impress someone?',
    'What comfort food can you never say no to?'
  ]
};

export function getIcebreakerForTopics(topics: string[]): string {
  for (const topic of topics) {
    if (TOPIC_ICEBREAKERS[topic] && TOPIC_ICEBREAKERS[topic].length > 0) {
      const options = TOPIC_ICEBREAKERS[topic];
      return options[Math.floor(Math.random() * options.length)];
    }
  }
  return topics.length > 0 
    ? `Hey! I noticed we both share an interest in ${topics[0]}. What got you into that?`
    : 'Hey there! What kind of things are you most passionate about lately?';
}
