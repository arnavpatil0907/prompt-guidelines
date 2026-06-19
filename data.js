/* =========================================================================
   MILEAGE — seed data (the only file you edit to keep guidance current)
   Sections: platforms · models · recommend · rules · inputTips
   All content is illustrative. Models and pricing move fast — verify before
   trusting a specific figure.
   ========================================================================= */

window.DATA = {

  /* Badges. tone sets the dot colour: video / image / text */
  platforms: {
    higgsfield: { label: "Higgsfield", tone: "video" },
    freepik:    { label: "Freepik",    tone: "image" },
    claude:     { label: "Claude",     tone: "text"  },
    chatgpt:    { label: "ChatGPT",    tone: "text"  },
  },

  /* ---- MODEL LIBRARY ----
     These are models you reach THROUGH the platforms above (e.g. Freepik and
     Higgsfield both host Kling, Seedance, etc.). type: video | image.
     tier: 1 cheap / 2 mid / 3 premium. tags drive the recommender. */
  models: [
    // ----- video -----
    { id:"seedance", label:"Seedance", type:"video", tier:1,
      platforms:["higgsfield","freepik"],
      tags:["social","fast","cheap","dynamic"],
      strengths:["Fast and easy on credits","Lively, dynamic motion","Handles multi-shot sequences well"],
      weakness:"Less fine camera control, and can over-animate calm scenes.",
      bestFor:"High-volume social clips where speed and cost matter most." },

    { id:"kling", label:"Kling", type:"video", tier:3,
      platforms:["higgsfield","freepik"],
      tags:["cinematic","realistic","quality","stylized"],
      strengths:["Realistic motion and physics","Strong prompt adherence","Holds up over longer, coherent shots"],
      weakness:"Pricier and slower per clip — overkill for a quick social cut.",
      bestFor:"Cinematic, realistic shots where motion quality actually shows." },

    { id:"higgsfield", label:"Higgsfield presets", type:"video", tier:2,
      platforms:["higgsfield"],
      tags:["camera-control","control","cinematic"],
      strengths:["Precise camera moves (push, orbit, crash)","Repeatable cinematic presets","Great for deliberately designed motion"],
      weakness:"Base realism leans on your start frame; stacked presets can look templated.",
      bestFor:"Shots where the camera move is the whole point." },

    { id:"veo", label:"Veo", type:"video", tier:3,
      platforms:["freepik"],
      tags:["quality","realistic","cinematic"],
      strengths:["High visual fidelity","Strong shot coherence","Native audio in some modes"],
      weakness:"Premium cost — reserve it for hero shots, not drafts.",
      bestFor:"Flagship hero shots where quality is non-negotiable." },

    // ----- image -----
    { id:"nanobanana", label:"Nano Banana", type:"image", tier:1,
      platforms:["freepik"],
      tags:["edit","generate","consistency","cheap","fast","product"],
      strengths:["Best-in-class image editing","Keeps a character or product consistent","Fast, cheap, blends several inputs"],
      weakness:"For brand-new generation, aesthetic-tuned models often look more polished.",
      bestFor:"Editing, retouching, and keeping a subject consistent across shots." },

    { id:"seedream", label:"Seedream", type:"image", tier:2,
      platforms:["freepik"],
      tags:["generate","photoreal","quality","illustration","text-in-image"],
      strengths:["High aesthetic quality from scratch","Strong realism and fine detail","Good with design and typography"],
      weakness:"Editing precision trails dedicated edit models.",
      bestFor:"Generating polished images and illustrations from a prompt." },

    { id:"gptimage", label:"GPT Image", type:"image", tier:3,
      platforms:["chatgpt","freepik"],
      tags:["generate","edit","instruction","text-in-image","product"],
      strengths:["Follows complex instructions reliably","Renders readable text in images","Good compositional control"],
      weakness:"Slower and pricier; can look a touch flat next to aesthetic-tuned models.",
      bestFor:"Prompts with lots of specific requirements, or text inside the image." },

    { id:"flux", label:"Flux", type:"image", tier:2,
      platforms:["freepik"],
      tags:["generate","photoreal","quality"],
      strengths:["Strong photorealism","Versatile, dependable base model","Good detail and lighting"],
      weakness:"Weaker text rendering and fewer editing controls.",
      bestFor:"Photoreal generation when you want a reliable workhorse." },

    { id:"magnific", label:"Magnific", type:"image", tier:2,
      platforms:["freepik"],
      tags:["upscale","enhance"],
      strengths:["Adds real resolution and detail","Faithful or creative modes","Great for finishing and print"],
      weakness:"High creativity invents detail and forces re-runs; it magnifies source flaws.",
      bestFor:"Upscaling and enhancing an image you already have." },
  ],

  /* ---- RECOMMENDER CONFIG ----
     Questions the user answers, plus the settings/tips that go with each path.
     The model itself is chosen by scoring tags (see app.js). */
  recommend: {
    video: {
      q1: { label:"What are you making?", key:"purpose", options:[
        { id:"social",   label:"Short social video", want:["social","fast","cheap"], settings:["720p","~5s","Low–med motion","24 fps"] },
        { id:"cinematic",label:"Cinematic / realistic shot", want:["cinematic","realistic","quality"], settings:["1080p","~5s","One camera move","Higher steps"] },
        { id:"product",  label:"Product / explainer loop", want:["control"], settings:["1080p","Static or slow push","24 fps","Short loop"] },
        { id:"stylized", label:"Stylized / creative", want:["stylized"], settings:["720–1080p","Higher creativity","~5s"] },
      ]},
      q2: { label:"What matters most?", key:"priority", options:[
        { id:"cost",    label:"Spend the least", boost:["cheap","fast"] },
        { id:"quality", label:"Best quality",    boost:["realistic","quality"] },
        { id:"control", label:"Most control",    boost:["camera-control","control"] },
      ]},
    },
    image: {
      q1: { label:"What do you need?", key:"task", options:[
        { id:"generate",label:"Generate a new image", hard:"generate", settings:["Set the size up front","Add one reference if you can"] },
        { id:"edit",    label:"Edit an existing image", hard:"edit", settings:["Feed the source image","Describe only the change"] },
        { id:"upscale", label:"Upscale / enhance", hard:"upscale", settings:["2× faithful or 4× creative","Clean the source first"] },
      ]},
      q2: { label:"What's the subject?", key:"style", onlyFor:["generate","edit"], options:[
        { id:"photoreal",   label:"Photoreal", want:["photoreal","quality"] },
        { id:"illustration",label:"Illustration / stylized", want:["illustration"] },
        { id:"product",     label:"Product shot", want:["product"] },
        { id:"text",        label:"Text / typography heavy", want:["text-in-image","instruction"] },
      ]},
      q3: { label:"What matters most?", key:"priority", options:[
        { id:"cost",       label:"Spend the least", boost:["cheap","fast"] },
        { id:"quality",    label:"Best quality",    boost:["quality","photoreal"] },
        { id:"instruction",label:"Nail the details", boost:["instruction","text-in-image"] },
      ]},
    },
    text: {
      q1: { label:"What's the task?", key:"task", options:[
        { id:"routine",  label:"Routine (draft, summarize, rephrase)",
          pick:"Fast tier", platforms:["claude","chatgpt"], detail:"Claude Haiku or ChatGPT mini",
          settings:["Trim the context","Skip the preamble"],
          why:"Routine text doesn't need a frontier model — the cheap tier is ~10–20× less per token for the same result." },
        { id:"reasoning",label:"Hard reasoning / math / tricky bug",
          pick:"Top tier", platforms:["claude","chatgpt"], detail:"Claude Opus or a ChatGPT reasoning model",
          settings:["State the goal precisely","Give the constraints once"],
          why:"The one place to pay up. A cheap model that fails sends you into a retry loop that costs more overall." },
        { id:"longcontext",label:"Long document / big context",
          pick:"Balanced tier", platforms:["claude"], detail:"Claude Sonnet",
          settings:["Prompt caching ON","Reference, don't re-paste"],
          why:"Sonnet handles large context well; caching stops you re-paying for the same document every turn." },
        { id:"coding",   label:"Everyday coding",
          pick:"Balanced tier", platforms:["claude"], detail:"Claude Sonnet",
          settings:["Show the file, not the repo","One change at a time"],
          why:"Most coding lands first-try on the balanced tier; reserve the top tier for the genuinely hard problems." },
        { id:"bulk",     label:"Bulk (many short outputs)",
          pick:"Cheapest capable model", platforms:["chatgpt","claude"], detail:"Mini / fast tier",
          settings:["Batch the calls","One tight instruction"],
          why:"Volume multiplies every inefficiency — cheapest capable model plus batching is the whole game here." },
      ]},
    },
  },

  /* ---- RULE BOOK ---- tag: always / default / avoid */
  rules: [
    { cat:"Video", tag:"always", if:"making a social reel, Short or TikTok", then:"cap it at 720p and about 5 seconds", why:"Vertical feeds re-compress hard. The extra pixels and seconds never reach the viewer — they just spend credits." },
    { cat:"Video", tag:"default", if:"the shot is near-static (talking head, product loop)", then:"skip the heavy motion presets", why:"Motion presets cost more and add nothing to a subject that isn't really moving." },
    { cat:"Video", tag:"default", if:"you want a cinematic feel", then:"pick a realism model and use one camera move", why:"One clean push or orbit on a model like Kling reads better — and cheaper — than stacking presets." },
    { cat:"Video", tag:"always", if:"your start frame is noisy or low-res", then:"fix the frame before you generate", why:"Motion amplifies whatever's already there. A weak frame guarantees a paid re-roll." },
    { cat:"Video", tag:"avoid", if:"tempted to render 10s 'to get more'", then:"render 5s and trim instead", why:"Duration multiplies the credit cost, usually for footage you cut anyway." },
    { cat:"Video", tag:"default", if:"churning out lots of social clips", then:"use a fast, cheap model like Seedance", why:"Save the premium realism models for the shots where the quality actually shows." },

    { cat:"Image & Upscale", tag:"default", if:"editing or retouching an existing image", then:"use an edit-first model like Nano Banana", why:"Edit models keep the subject consistent and cost far less than re-generating from scratch." },
    { cat:"Image & Upscale", tag:"default", if:"generating a polished image from a prompt", then:"use an aesthetic model like Seedream or Flux", why:"They look better out of the box, so you regenerate less." },
    { cat:"Image & Upscale", tag:"default", if:"the image needs readable text or strict details", then:"use GPT Image", why:"It follows instructions and renders text more reliably, saving correction rounds." },
    { cat:"Image & Upscale", tag:"always", if:"upscaling a real photo you want to stay faithful", then:"keep Creativity low and Resemblance high", why:"High creativity invents detail that wasn't there, which sends you into re-runs." },
    { cat:"Image & Upscale", tag:"always", if:"choosing an upscale factor", then:"pick it from your real output size, not the maximum", why:"8×–16× past the crop you'll actually publish is pure waste." },
    { cat:"Image & Upscale", tag:"avoid", if:"an image has already been upscaled once", then:"don't upscale it again", why:"Errors compound across passes — you pay more for a worse result." },
    { cat:"Image & Upscale", tag:"default", if:"generating a marketing or hero image", then:"attach one reference image", why:"A reference does what ten adjectives can't, cutting the regenerations that quietly burn credits." },

    { cat:"Text & Reasoning", tag:"always", if:"the task is routine (draft, summarize, rephrase)", then:"use the fast/cheap tier", why:"Routine text doesn't need a frontier model. The cheap tier is roughly 10–20× less per token for the same result." },
    { cat:"Text & Reasoning", tag:"always", if:"the task is genuinely hard (math, architecture, a tricky bug)", then:"use the top tier", why:"A cheap model that fails drops you into a retry loop that costs more overall." },
    { cat:"Text & Reasoning", tag:"default", if:"doing everyday coding", then:"default to the balanced tier", why:"Most coding lands first-try without the top tier; reserve that for the hard problems." },
    { cat:"Text & Reasoning", tag:"always", if:"working with large context you'll reuse across turns", then:"turn on prompt caching", why:"Caching stops you re-paying for the same document on every single message." },
    { cat:"Text & Reasoning", tag:"always", if:"generating many short outputs in bulk", then:"use the cheapest capable model and batch the calls", why:"Volume multiplies every inefficiency — this is where waste compounds fastest." },

    { cat:"Every tool", tag:"always", if:"a cheaper setting or model looks identical in the final medium", then:"use the cheaper one", why:"The whole game in one rule: spend only where the viewer or reader can actually tell." },
    { cat:"Every tool", tag:"default", if:"you're unsure what a model or setting costs", then:"test once small before a batch run", why:"One cheap probe beats discovering the cost across fifty outputs." },
    { cat:"Every tool", tag:"default", if:"a tool offers a 'max' preset", then:"treat max as a ceiling, not a default", why:"Maximums are there for the rare case that needs them, not for every job." },
    { cat:"Every tool", tag:"always", if:"the model lineup or pricing has changed", then:"re-verify these rules", why:"This space moves fast; a rule that saved credits last month can be stale today." },
  ],

  /* ---- INPUT TIPS ---- shown with a recommendation. keyed by platform. */
  inputTips: {
    higgsfield: { do:["Start from a clean, high-contrast key frame.","Keep one clear subject; simple background."], dont:["Don't feed a noisy or low-res start frame.","Don't pad the duration to 'get more'."] },
    freepik:    { do:["Feed the cleanest source you have.","Pick the factor from your target size, not the max."], dont:["Don't max every slider.","Don't upscale an already-upscaled image."] },
    claude:     { do:["Give structured context with clear labels.","Show one example of the output you want."], dont:["Don't paste whole files when a slice will do.","Don't pad with preamble."] },
    chatgpt:    { do:["Put standing rules in custom instructions.","For images, add one reference."], dont:["Don't re-explain the same context each time.","Don't rely on adjectives alone for images."] },
  },
};
