# What We're Building: A Project About How Information Gets Shaped

## The Simple Version

We're building a website that shows how the same question can get wildly different answers depending on tiny, invisible choices made when organising information.

Think of it like this: imagine you're trying to understand what the government thinks about the NHS. You could get completely different impressions depending on whether you read a politician's full speech, just the soundbite that made the news, or only the bit where they were responding to a hostile question. Our project makes those differences visible.

---

## The Slightly More Detailed Version

### What's the Problem?

When you ask a question to modern AI chatbots (like ChatGPT or others), they often need to search through massive amounts of text to find relevant information. But here's the thing: they can't read everything at once. So they break documents into smaller pieces - we call these "chunks" - and then search through those pieces to find what's relevant to your question.

The uncomfortable truth nobody talks about: **how you break up those documents completely changes what answers you get**. It's not a neutral, technical decision. It's actually shaping what gets to count as "the answer."

### Our Experiment

We're taking transcripts from UK Parliamentary debates (Prime Minister's Questions, policy debates, committee hearings - the full theatrical shambles) and processing them in four different ways:

1. **Large chunks** (1,024 tokens each) ✅ **COMPLETE** - lots of context around each statement
2. **Small chunks** (256 tokens each) ✅ **COMPLETE** - more focused, less surrounding context
3. **Large chunks with source awareness** (1,024 tokens, late chunking) - same as #1, but the system "knows" where each chunk came from
4. **Small chunks with source awareness** (256 tokens, late chunking) - same as #2, but context-aware

**Current Status**: The first two semantic chunking strategies are operational and can be tested with real parliamentary debates. The late chunking variants (strategies 3 and 4) are next on the roadmap.

Then we let people ask the same question to all four versions simultaneously and compare what they get back.

### Why Parliamentary Debates?

Because parliamentary language is *deliberately* slippery. Politicians say things that mean completely different things depending on:

- **Who's speaking**: A minister saying "we're committed to protecting the NHS" means something different than a backbencher saying it
- **When they're speaking**: The government's position on Tuesday might contradict their position from Thursday (whilst they insist they're being perfectly consistent)
- **Who they're responding to**: "I thank my right honourable friend" (translation: prepared statement) versus "The honourable member is mistaken" (translation: you're about to get demolished)
- **What context they're in**: Question Time versus a committee hearing versus a written response

All of these contextual signals can get lost or preserved depending on how we chop up the text. Our project makes that visible.

---

## What You'll Actually See

**Current Status**: You can currently test the chunking strategies directly using command-line tools that process real parliamentary debates and show detailed comparisons. A web interface is planned for the next phase.

When the web interface is complete, you'll be able to type in: "What is the government's position on NHS privatisation?"

You'll see **four different answers** displayed side by side, each one pulled from a different version of the same parliamentary debates.

You might find that:

- The large-chunk version quotes a minister's full, carefully hedged statement
- The small-chunk version only caught the soundbite and missed the caveats
- The context-aware versions might correctly attribute contradictory statements to different speakers
- The non-context-aware versions might mash together opposing viewpoints into a confused mess

Each answer will show you **exactly which MP said what, when, and in what context** - complete with links back to the official parliamentary record (Hansard). You'll be able to see precisely how the different processing choices led to different results.

---

## Why This Matters (The Uncomfortable Bit)

Most AI chatbots that answer questions from documents make these chunking decisions invisibly. You never see them. They're treated as boring technical details that don't affect anything important.

But they do. They affect:

- **Whose voice gets amplified**: Does the system favour government statements over opposition responses?
- **What gets lost**: Do careful qualifications get separated from bold claims?
- **How contradictions appear**: Do U-turns become visible or invisible?

We're not trying to build the "best" system. We're trying to show that there is no neutral way to do this. Every technical choice encodes assumptions about what information matters and how meaning gets preserved.

### The Political Layer

Parliamentary debates are full of people arguing about the same facts whilst reaching opposite conclusions. When you ask "what happened," the answer depends enormously on whose framing you accept.

Traditional media does this too - everyone knows newspapers have editorial bias. But AI systems that answer questions feel authoritative and neutral. Our project demonstrates that they're making editorial choices at the level of infrastructure, before you ever see a word on screen.

---

## What We're NOT Doing

This is not:
- ❌ A helpful chatbot for understanding parliament (though it might accidentally be useful)
- ❌ An attempt to build an "unbiased" system (no such thing exists)
- ❌ A way to catch politicians lying (though it might expose inconsistencies)
- ❌ A production-ready tool anyone should use for important decisions

This IS:
- ✅ A diagnostic instrument that makes invisible choices visible
- ✅ A demonstration that technical architecture encodes ideology
- ✅ An experiment in surfacing how information systems shape discourse
- ✅ Hopefully, a bit unsettling

---

## The Experience

When you use our website, you'll be able to:

1. **Ask questions** about topics covered in parliamentary debates
2. **See four different answers** generated from the same underlying data
3. **Compare the citations** - which MPs got quoted by which system?
4. **Explore the differences** - where do the answers diverge and why?
5. **Follow the links** back to the original parliamentary record to verify everything

We're also tracking metrics like:
- How often the four systems retrieve completely different sources
- Whether certain processing methods systematically favour government over opposition voices
- Which chunking strategies lose critical context at boundaries
- How speaker attribution affects meaning

---

## The Bigger Picture

Most people interact with AI systems that search through documents and think: "it found the answer in the document." But that's not quite right. It found *an answer* from *a version* of the document that was created through *a series of processing choices*.

Those choices aren't neutral. They're not purely technical. They shape what gets to count as knowledge, whose voice gets heard, and what context survives.

We're building infrastructure that makes those choices explicit rather than invisible. It's uncomfortable because it suggests that the answers you get from AI systems aren't just reflecting what's "in" the documents - they're shaped by how those documents got processed.

Which means every RAG system (Retrieval-Augmented Generation - the technical name for "AI that answers questions by searching documents") is making editorial decisions about information architecture, whether the builders realize it or not.

---

## Who This Is For

- **People curious about how AI actually works** beyond the marketing
- **Anyone interested in political discourse** and how framing shapes meaning  
- **Students learning about information systems** and the choices they encode
- **The generally suspicious** who think technical systems aren't as neutral as they claim

You don't need to understand the code. You don't need to know what an embedding is or how vector databases work. You just need to be willing to ask: "why did these four systems give me four different answers from the same debates?"

The answer to that question is what our project is about.

---

## The Slightly Chaotic Underpinning

We're three people building this over about two weeks as an experimental/educational project. We're deliberately not optimizing away the messiness. The contradictions, the attribution failures, the chunks that lose critical context - these aren't bugs we're trying to fix. They're the findings.

**Progress Update**: Two of four chunking strategies are complete and operational. The semantic chunking pipelines (1,024 and 256 tokens) are processing real parliamentary debates, preserving speaker boundaries, and generating embeddings. You can test these right now by running the comparative analysis scripts included in the repository.

The goal isn't to build a system that works better. It's to build a system that makes visible how all such systems work, and to demonstrate that those workings encode choices about whose meaning gets preserved.

It's infrastructure criticism disguised as a web application.

---

## Final Thought

Every time you ask an AI to summarize a document or answer a question from text, invisible decisions are being made about how to break up that text, what counts as relevant context, and whose framing gets priority.

Our project gives you a window into those decisions. What you do with that knowledge is up to you, but at least you'll know it's happening.

Welcome to the slightly unsettling world of information architecture.
