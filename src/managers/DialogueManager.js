import { dialoguesData } from '../data/dialogues.js';

export default class DialogueManager {
  constructor() {
    this.overlay = null;
    this.nameElement = null;
    this.roleElement = null;
    this.textElement = null;
    this.indicatorElement = null;
    this.thinkingIndicator = null; // AI loading indicator element

    // Dialogue State
    this.activeDialogue = null;
    this.pageIndex = 0;
    this.isWriting = false;
    this.typewriterTimer = null;
    this.onCompleteCallback = null;
    this.isDialogueActive = false;
    this.currentNPC = null;
  }

  init() {
    // Bind to existing HTML elements created in index.html
    this.overlay = document.getElementById('dialogue-overlay');
    this.nameElement = document.getElementById('dialogue-name');
    this.roleElement = document.getElementById('dialogue-role');
    this.textElement = document.getElementById('dialogue-text');
    this.indicatorElement = document.getElementById('dialogue-indicator');
    this.thinkingIndicator = document.getElementById('ai-thinking-indicator');
  }

  startDialogue(dialogueId, npc, onComplete) {
    let pages = dialoguesData[dialogueId];

    // Check if NPC is sleeping
    if (npc && npc.isSleeping) {
      pages = [{
        speaker: npc.name,
        text: "Zzz... (They are sleeping soundly. It is best not to disturb them now.)"
      }];
    }

    if (!pages || pages.length === 0) {
      console.warn(`[Dialogue] Dialogue ID "${dialogueId}" not found in dialogues.js.`);
      if (onComplete) onComplete();
      return;
    }

    this.activeDialogue = pages;
    this.currentNPC = npc;
    this.pageIndex = 0;
    this.onCompleteCallback = onComplete;
    this.isDialogueActive = true;

    // Show overlay
    if (this.overlay) {
      this.overlay.className = 'dialogue-visible';
    }

    this.showPage();
  }

  showPage() {
    if (!this.activeDialogue) return;

    const page = this.activeDialogue[this.pageIndex];
    this.nameElement.textContent = page.speaker;

    // Render Role if NPC reference or page defines it
    const npcRole = page.role || (this.currentNPC ? this.currentNPC.role : null);
    if (npcRole) {
      this.roleElement.style.display = 'inline-block';
      this.roleElement.textContent = npcRole;
    } else {
      this.roleElement.style.display = 'none';
    }

    // Start typewriter effect
    this.isWriting = true;
    this.textElement.textContent = '';
    let charIndex = 0;

    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
    }

    if (this.indicatorElement) {
      this.indicatorElement.textContent = '...';
    }

    this.typewriterTimer = setInterval(() => {
      if (charIndex < page.text.length) {
        this.textElement.textContent += page.text[charIndex];
        charIndex++;
      } else {
        this.finishPage();
      }
    }, 25); // Character type rate: 25ms per letter
  }

  finishPage() {
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
    }
    
    const page = this.activeDialogue[this.pageIndex];
    this.textElement.textContent = page.text;
    this.isWriting = false;

    // Update enter pointer text
    if (this.indicatorElement) {
      const isLastPage = this.pageIndex === this.activeDialogue.length - 1;
      this.indicatorElement.textContent = isLastPage ? 'Space/Enter to close' : 'Space/Enter to continue';
    }
  }

  advanceDialogue() {
    if (!this.isDialogueActive) return;
    if (!this.activeDialogue) return; // AI still thinking — dialogue not ready yet, ignore keypress

    if (this.isWriting) {
      // Skip typing effect and show entire line immediately
      this.finishPage();
    } else {
      // Advance page or close dialogue
      if (this.pageIndex < this.activeDialogue.length - 1) {
        this.pageIndex++;
        this.showPage();
      } else {
        this.closeDialogue();
      }
    }
  }

  closeDialogue() {
    this.isDialogueActive = false;
    
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
    }

    if (this.overlay) {
      this.overlay.className = 'dialogue-hidden';
    }

    this.activeDialogue = null;
    this.currentNPC = null;

    // Trigger complete callback to restore player inputs
    if (this.onCompleteCallback) {
      this.onCompleteCallback();
    }
  }

  // ─── AI Dialogue Methods ────────────────────────────────────────────────

  /**
   * Shows the "Thinking..." loading indicator while the ML server processes.
   * Also opens the dialogue overlay so it feels responsive immediately.
   * @param {NPC} npc - The NPC being interacted with.
   */
  showThinking(npc) {
    if (this.overlay) {
      this.overlay.className = 'dialogue-visible';
    }
    if (this.nameElement && npc) {
      this.nameElement.textContent = npc.name;
    }
    if (this.roleElement && npc) {
      this.roleElement.style.display = npc.role ? 'inline-block' : 'none';
      this.roleElement.textContent = npc.role || '';
    }
    if (this.textElement) {
      this.textElement.textContent = '';
    }
    if (this.indicatorElement) {
      this.indicatorElement.textContent = '';
    }
    if (this.thinkingIndicator) {
      this.thinkingIndicator.classList.add('thinking-active');
    }
    this.isDialogueActive = true;
  }

  /**
   * Hides the "Thinking..." loading indicator.
   */
  hideThinking() {
    if (this.thinkingIndicator) {
      this.thinkingIndicator.classList.remove('thinking-active');
    }
  }

  /**
   * Starts a dialogue using an AI-generated response object.
   * Feeds the response into the existing typewriter/page system — identical UX.
   *
   * @param {NPC} npc - The NPC being interacted with.
   * @param {{thoughts: string, emotion: string, action: string, dialogue: string}} aiResponse
   * @param {function|null} onComplete - Called when dialogue closes.
   */
  startAIDialogue(npc, aiResponse, onComplete) {
    // Update the NPC's live emotion state from the AI response
    if (npc && aiResponse.emotion) {
      npc.emotion = aiResponse.emotion;
    }
    if (npc && aiResponse.action) {
      npc.currentAction = aiResponse.action;
    }

    // Log the NPC's thoughts for future memory system integration
    if (aiResponse.thoughts) {
      console.log(`[NPCAIManager] 💭 ${npc?.name} thinks: "${aiResponse.thoughts}"`);
    }

    // Wrap dialogue text as a single page array (compatible with existing system)
    const pages = [{
      speaker: npc?.name || 'NPC',
      text: aiResponse.dialogue || '...',
    }];

    // Hide thinking indicator before starting the real dialogue
    this.hideThinking();

    // Reuse existing startDialogue flow with the AI-generated page
    this.activeDialogue = pages;
    this.currentNPC = npc;
    this.pageIndex = 0;
    this.onCompleteCallback = onComplete;
    this.isDialogueActive = true;

    this.showPage();
  }
}
