'use server'

import { auth } from "@/app/auth"
import { prisma } from "@/lib/prisma"

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

export async function analyzeAgentAction(userId: string, userInput: string) {
  // Verify the caller is authenticated and requesting their own data
  const session = await auth()
  if (!session?.user?.email) {
    return (async function* () {
      yield `data: ${JSON.stringify({ error: "Unauthorized" })}\n\n[DONE]`;
    })();
  }
  const currentUser = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!currentUser || currentUser.id !== userId) {
    return (async function* () {
      yield `data: ${JSON.stringify({ error: "Unauthorized" })}\n\n[DONE]`;
    })();
  }

  try {
    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        milestones: {
          include: {
            quests: {
              include: {
                tasks: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      throw new Error("User not found");
    }

    // Transform to backend payload format
    const payload = {
      username: user.username || user.name || "User",
      dateOfBirth: user.dateOfBirth?.toISOString().split('T')[0] || "Unknown",
      interests: user.interests ? user.interests.join(', ') : "",
      location: "Digital Nomad",
      bio: user.bio || "I want to improve my life.",
      user_input: userInput,
      
      current_roadmap: user.milestones.map(m => ({
        milestoneId: m.id,
        title: m.title,
        desc: m.description || "",
        quests: m.quests.map(q => ({
          questId: q.id,
          title: q.title,
          desc: q.description || "",
          tasks: q.tasks.map(t => ({
            taskId: t.id,
            title: t.content,
            desc: ""
          }))
        }))
      }))
    };

    // Send to Python backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/analyze-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend Error: ${response.status} - ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return (async function* () {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        yield chunk;
      }
    })();

  } catch (error: any) {
    console.error('Server Action Error:', error);
    return (async function* () {
      yield `data: ${JSON.stringify({ error: error.message || "Unknown server error" })}\n\n[DONE]`;
    })();
  }
}