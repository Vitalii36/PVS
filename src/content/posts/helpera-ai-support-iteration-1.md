---
title: "Helpera — Notes from the First Iteration of AI Support Design"
date: 2026-04-15
slug: helpera-ai-support-iteration-1
tags: [ai, odoo, rag, support, design]
summary: "What changed between v1 and v2 of an AI-first support agent for Odoo — escalation by client action instead of classifier, explicit context fields, multi-source RAG with vision, and one question at a time."
---

**Status:** v2 approved.
**Context:** First-line AI agent for technical support based on Odoo. Channels: Odoo Live Chat + incoming email. L3 = engineer, escalation.

---

## 1. Recorded flow v2

A linear backbone with two clarification loops and an explicit CTA to L3.

```
Intake (chat | email)
  → Security warning  (once per session)
  → Extract context   (company · module · issue)
  → [Fields complete?]
      missing → Ask next field → loop
      ready   → RAG search  (docs · Odoo · code · vision)
  → [Found?]
      no  → [Attempt < 3?]
               yes → Rephrase query → retry RAG
               no  → Ask clarifying Q → Client answers → fresh RAG
      yes → Generate response
  → Show answer + CTA  ("Create ticket" — button / text command)
  → [Validated?]
      yes   → Resolved ✓
      retry → back to RAG
      L3    → Context snapshot → Create L3 ticket → Notify client
```

## 2. Key architectural decisions in v2

- **Escalation on explicit CTA, not on a classifier.** L3 is triggered by an action the client takes, not by automatic classification. This removes a whole category of classifier-failure scenarios from v1.
- **Context fields are first-class objects.** `company · module · issue` get extracted from the first message and validated against a required template *before* RAG fires. Missing fields produce targeted questions one at a time, not a free-form dialogue.
- **Multi-source RAG with vision.** Search runs in parallel over product documentation, structured Odoo data (partners, sales orders, invoices), and code; screenshots flow through vision and merge into the same context.
- **Two distinct retry loops:** internal rephrase (up to 3) without bothering the client, then an external clarification (one question) when internal rephrase is exhausted. After the answer, fresh RAG.
- **Single-question discipline.** Both the fields loop and the clarification loop are capped at one question per turn. Encoded as a hard constraint in the system prompt.
- **Security warning as the first step, not a footer.** Shown before context extraction, once per session.

## 3. Changes v1 → v2

| # | Area | v1 | v2 | Why |
|---|------|----|----|-----|
| 1 | Routing | LLM classifies intent / level / confidence → auto L1/L2/L3 | CTA-driven L3 | Removes classifier failure as a risk vector |
| 2 | Channels | chat only | chat + email, unified structure | Real intake includes both |
| 3 | Context | implicit (via classifier) | explicit (extracted and validated) | Predictability and audit |
| 4 | Multimodality | absent | vision in RAG | Screenshots are a basic form of support request |
| 5 | Security | absent | warning at session start | Compliance baseline |
| 6 | Post-answer state | binary (resolved / new message) | three-way (confirmed · retry · L3 CTA) | Reflects the real states of the conversation |
| 7 | L3 ticket flow | 4 steps | 3 steps | Streamlined with the context already collected |

## 4. Open issues

- Session definition for the security warning
- Partner identification method
- Mandatory fields and validation rules
- Retry limits
- RAG score thresholds
- Merging vision and text data
- Handling clarified queries
- The validated-gate mechanism
- L3 ticket logic
- Deadlock scenarios

## 5. Doubts about the current design

- Validation stage
- Attempts-counter state management
- Email path specification
- Session concept for email

## 6. Next steps

1. Resolve pending validation and RAG questions
2. Define validated-gate mechanics
3. Add a deadlock guard
4. Update the diagrams in v3
