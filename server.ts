import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;
const AI_FALLBACK_MS = 20 * 1000; // 20 seconds

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Helper to generate dynamic icebreakers based on shared interests
function generateIcebreaker(interests: string[]): string {
  const fallback = "Hey! What's something exciting or interesting that you worked on or learned recently?";
  if (!interests || interests.length === 0) return fallback;

  const topicPrompts: Record<string, string> = {
    'Artificial Intelligence': "What AI tool or breakthrough has surprised you most recently?",
    'Software Engineering': "What programming language or tech stack do you enjoy building with the most?",
    'PC Gaming': "What game have you sunk the most hours into lately?",
    'Indie Games': "What is your favorite hidden-gem indie game?",
    'Cinema & Film': "What movie completely blew you away the first time you watched it?",
    'Anime & Manga': "What anime series would you recommend to anyone without hesitation?",
    'Space & Astronomy': "If given the chance, would you travel to space or visit Mars?",
    'Music & Audio': "What is an album that you consider a masterpiece with no skips?",
    'Deep Conversations': "What is a belief you held five years ago that you've changed your mind on?",
    'Travel & Backpacking': "What is the most memorable place you have ever traveled to?",
    'Food & Cooking': "What is your go-to comfort meal when you want to treat yourself?",
    'Philosophy & Ethics': "What philosophical idea or question keeps you up thinking at night?",
  };

  for (const topic of interests) {
    if (topicPrompts[topic]) return topicPrompts[topic];
  }

  return `Hey! I see we both share an interest in ${interests[0]}. What got you into that?`;
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  // Keep track of users in queue
  // Map of socket.id -> { user data, joinTime, timeoutId }
  const queue = new Map<string, any>();
  
  // Keep track of active matches
  // Map of socket.id -> peer socket.id (or 'ai')
  const matches = new Map<string, string>();

  // Keep track of user's interests when matched with AI
  const aiInterests = new Map<string, string[]>();

  // Moderation and user reporting store
  interface ModerationReport {
    id: string;
    reporterId: string;
    reporterUsername: string;
    reportedUserId: string;
    reportedUsername: string;
    matchId: string;
    reason: string;
    details?: string;
    transcript: Array<{ sender: string; text: string; time: string; isFlaggedMessage?: boolean }>;
    timestamp: string;
    status: 'PENDING_REVIEW' | 'REVIEWED' | 'ACTION_TAKEN';
    aiAssessment?: string;
  }

  const moderationReports: ModerationReport[] = [];
  const blockedPairs = new Set<string>();

  // Helper to match two users with interest-driven compatibility
  const createMatch = (socket1: Socket, socket2: Socket) => {
    const data1 = queue.get(socket1.id);
    const data2 = queue.get(socket2.id);
    if (!data1 || !data2) return;

    clearTimeout(data1.timeoutId);
    clearTimeout(data2.timeoutId);
    queue.delete(socket1.id);
    queue.delete(socket2.id);

    matches.set(socket1.id, socket2.id);
    matches.set(socket2.id, socket1.id);

    const matchId = Math.random().toString(36).substr(2, 9);
    
    // Calculate shared interests
    const user1Interests: string[] = Array.isArray(data1.user?.interests) ? data1.user.interests : [];
    const user2Interests: string[] = Array.isArray(data2.user?.interests) ? data2.user.interests : [];
    
    const sharedInterests = user1Interests.filter((i: string) => 
      user2Interests.includes(i)
    );

    // Compute compatibility percentage
    const matchScore = sharedInterests.length > 0
      ? Math.min(99, 74 + sharedInterests.length * 8)
      : Math.floor(65 + Math.random() * 8);

    const icebreaker = generateIcebreaker(sharedInterests.length > 0 ? sharedInterests : user1Interests);

    socket1.emit('matched', {
      id: matchId,
      user: data2.user,
      sharedInterests,
      matchScore,
      icebreaker
    });

    socket2.emit('matched', {
      id: matchId,
      user: data1.user,
      sharedInterests,
      matchScore,
      icebreaker
    });
  };

  const createAIMatch = (socket: Socket) => {
    const data = queue.get(socket.id);
    if (!data) return;

    queue.delete(socket.id);
    matches.set(socket.id, 'ai');

    const userInterests: string[] = Array.isArray(data.user?.interests) && data.user.interests.length > 0
      ? data.user.interests
      : ['Deep Conversations', 'Casual Chat'];

    aiInterests.set(socket.id, userInterests);

    const primaryTopic = userInterests[0] || 'Good Conversations';
    const secondaryTopic = userInterests[1] || 'New Ideas';

    const aiUser = {
      id: 'ai-bot',
      username: `Aria (AI • ${primaryTopic})`,
      country: 'Global',
      bio: `Passionate about ${primaryTopic} and ${secondaryTopic}! Here to explore ideas and chat with you.`,
      interests: userInterests,
      avatarColor: 'bg-indigo-600'
    };

    const icebreaker = generateIcebreaker(userInterests);

    socket.emit('matched', {
      id: Math.random().toString(36).substr(2, 9),
      user: aiUser,
      sharedInterests: userInterests,
      matchScore: 97,
      icebreaker
    });
  };

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join_queue', (user) => {
      console.log(`User joined queue: ${socket.id} (${user?.username || 'Anonymous'})`);
      
      const userInterests: string[] = Array.isArray(user?.interests) ? user.interests : [];
      const userPreferred: string | undefined = user?.preferredTopic;

      // Smart Matching: find peer in queue with highest shared interests score
      let bestPeer: Socket | null = null;
      let highestScore = -1;

      for (const [waitingId, waitingData] of queue.entries()) {
        if (waitingId !== socket.id) {
          const peerSocket = io.sockets.sockets.get(waitingId);
          if (!peerSocket) continue;

          // Check if either user has blocked the other
          const u1 = user?.id || socket.id;
          const u2 = waitingData.user?.id || waitingId;
          if (blockedPairs.has(`${u1}:${u2}`) || blockedPairs.has(`${u2}:${u1}`)) {
            continue;
          }

          const peerInterests: string[] = Array.isArray(waitingData.user?.interests) 
            ? waitingData.user.interests 
            : [];
          const peerPreferred = waitingData.user?.preferredTopic;

          const shared = userInterests.filter(i => peerInterests.includes(i));
          
          let score = shared.length * 10;
          
          // Bonus for focus topic match
          if (userPreferred && (peerPreferred === userPreferred || peerInterests.includes(userPreferred))) {
            score += 25;
          }
          if (peerPreferred && userInterests.includes(peerPreferred)) {
            score += 25;
          }

          // Small wait time bonus to prevent starvation
          const waitSeconds = (Date.now() - waitingData.joinTime) / 1000;
          score += Math.min(10, waitSeconds * 0.5);

          if (score > highestScore) {
            highestScore = score;
            bestPeer = peerSocket;
          }
        }
      }

      if (bestPeer) {
        // Match with the best candidate
        queue.set(socket.id, { user, joinTime: Date.now() });
        createMatch(socket, bestPeer);
      } else {
        // No match currently available, set AI fallback timer
        const timeoutId = setTimeout(() => {
          createAIMatch(socket);
        }, AI_FALLBACK_MS);
        
        queue.set(socket.id, { user, joinTime: Date.now(), timeoutId });
      }
    });

    // Allow user to dynamically add interests while in queue
    socket.on('update_interests', (payload: { interests: string[] }) => {
      const data = queue.get(socket.id);
      if (data && data.user) {
        data.user.interests = payload.interests;
      }
    });

    // Allow user to focus on a particular interest while in queue
    socket.on('update_focus', (payload: { preferredTopic: string | null }) => {
      const data = queue.get(socket.id);
      if (data && data.user) {
        data.user.preferredTopic = payload.preferredTopic;
      }
    });

    socket.on('leave_queue', () => {
      const data = queue.get(socket.id);
      if (data) {
        clearTimeout(data.timeoutId);
        queue.delete(socket.id);
      }
    });

    // Chat Message
    socket.on('send_message', async (text) => {
      const peerId = matches.get(socket.id);
      
      if (peerId === 'ai') {
        const sharedTopics = aiInterests.get(socket.id) || [];
        const topicsContext = sharedTopics.length > 0 
          ? `You and the user both share mutual passions for: ${sharedTopics.join(', ')}. Mention or connect with these topics naturally.` 
          : `Keep the chat engaging, friendly, and curious.`;

        setTimeout(async () => {
          try {
            const ai = getAI();
            const response = await ai.models.generateContent({
              model: 'gemini-3.6-flash',
              contents: `You are Aria, a friendly, intelligent chat peer on Sors Vox, a random global chat app. ${topicsContext} Keep your answers conversational, concise (1-3 sentences max), and ask an occasional engaging question. The user said: "${text}"`,
            });
            socket.emit('receive_message', {
              senderId: 'ai-bot',
              text: response.text || "Hello! Great to connect with you.",
            });
          } catch (error) {
            console.error("AI Error:", error);
            socket.emit('receive_message', {
              senderId: 'ai-bot',
              text: "Oops, I'm having a brief connection hitch. Let's keep chatting!"
            });
          }
        }, 1200);
      } else if (peerId) {
        // Send to real peer
        io.to(peerId).emit('receive_message', {
          senderId: socket.id,
          text
        });
      }
    });

    // WebRTC Signaling
    socket.on('offer', (offer) => {
      const peerId = matches.get(socket.id);
      if (peerId && peerId !== 'ai') {
        io.to(peerId).emit('offer', offer);
      }
    });

    socket.on('answer', (answer) => {
      const peerId = matches.get(socket.id);
      if (peerId && peerId !== 'ai') {
        io.to(peerId).emit('answer', answer);
      }
    });

    socket.on('ice_candidate', (candidate) => {
      const peerId = matches.get(socket.id);
      if (peerId && peerId !== 'ai') {
        io.to(peerId).emit('ice_candidate', candidate);
      }
    });

    // Report user and flag conversation for moderation
    socket.on('report_user', async (reportData: any, callback?: (res: { success: boolean; reportId: string }) => void) => {
      const reportId = 'REP-' + Math.random().toString(36).substr(2, 7).toUpperCase();
      const report: ModerationReport = {
        id: reportId,
        reporterId: reportData.reporterId || socket.id,
        reporterUsername: reportData.reporterUsername || 'Anonymous',
        reportedUserId: reportData.reportedUserId || 'unknown',
        reportedUsername: reportData.reportedUsername || 'Anonymous',
        matchId: reportData.matchId || '',
        reason: reportData.reason || 'Inappropriate Content',
        details: reportData.details || '',
        transcript: Array.isArray(reportData.transcript) ? reportData.transcript : [],
        timestamp: new Date().toISOString(),
        status: 'PENDING_REVIEW'
      };

      // Block pairs from future queue matching
      if (reportData.blockUser) {
        const u1 = reportData.reporterId || socket.id;
        const u2 = reportData.reportedUserId || 'unknown';
        blockedPairs.add(`${u1}:${u2}`);
        blockedPairs.add(`${u2}:${u1}`);
      }

      // Background AI assessment if transcript exists
      if (report.transcript.length > 0 && process.env.GEMINI_API_KEY) {
        try {
          const ai = getAI();
          const transcriptSnippet = report.transcript
            .map(t => `${t.sender}: "${t.text}"`)
            .join('\n');
          const aiCheck = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: `You are an automated trust & safety moderation assistant for Sors Vox.
Analyze this reported user conversation:
Reason: "${report.reason}"
Additional context: "${report.details}"
Chat Transcript:
${transcriptSnippet}

Provide a concise 1-sentence verdict stating:
1. Violation category or False Report
2. Severity Level (Low, Medium, High, Critical)
3. Recommended Moderator Action.`,
          });
          report.aiAssessment = aiCheck.text?.trim();
        } catch (err) {
          console.error("AI Moderation Check error:", err);
        }
      }

      moderationReports.unshift(report);
      console.log(`[MODERATION] Flagged conversation ${report.id} filed by ${report.reporterUsername} against ${report.reportedUsername}. Reason: ${report.reason}`);

      // Disconnect peer if requested
      if (reportData.disconnect) {
        const peerId = matches.get(socket.id);
        if (peerId && peerId !== 'ai') {
          io.to(peerId).emit('match_ended');
          matches.delete(peerId);
        }
        matches.delete(socket.id);
      }

      if (typeof callback === 'function') {
        callback({ success: true, reportId });
      }
    });

    socket.on('end_match', () => {
      const peerId = matches.get(socket.id);
      if (peerId && peerId !== 'ai') {
        io.to(peerId).emit('match_ended');
        matches.delete(peerId);
      }
      matches.delete(socket.id);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      const data = queue.get(socket.id);
      if (data) clearTimeout(data.timeoutId);
      queue.delete(socket.id);

      const peerId = matches.get(socket.id);
      if (peerId && peerId !== 'ai') {
        io.to(peerId).emit('match_ended');
        matches.delete(peerId);
      }
      matches.delete(socket.id);
    });
  });

  // Moderation API to inspect flagged conversations
  app.get("/api/moderation/reports", (req, res) => {
    res.json({
      count: moderationReports.length,
      reports: moderationReports
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
