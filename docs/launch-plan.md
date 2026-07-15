# Codex TUI Proof launch plan

Prepared July 15, 2026. The goal is useful adoption among Codex users and TUI maintainers, not a one-day traffic spike.

## Positioning

**Category:** visual validation infrastructure for coding agents.

**One sentence:** Codex TUI Proof lets Codex interact with a real local TUI in its in-app browser and return screenshot plus session evidence without controlling the desktop.

**Lead with:** real PTY, deterministic geometry, controlled browser screenshots, local-only recordings, no Computer Use.

**Do not lead with:** xterm.js, WebSockets, “AI-powered,” or “another terminal emulator.” Those are implementation details or misleading categories.

## Release gate

Before any announcement:

- [ ] Publish `bnc4vk/codex-tui-proof` as a public GitHub repository with `main` as the default branch.
- [ ] Confirm MIT is the intended license and Ben Cohen is the intended publisher identity.
- [ ] Confirm the public privacy policy, terms, and security-reporting URLs resolve.
- [ ] Confirm Runtime CI passes on macOS, Windows, and Linux.
- [ ] Confirm the HOL scanner passes at 80/130 or higher with no high or critical findings.
- [ ] Test the two-command install from a clean marketplace configuration.
- [ ] Run the skill in a new task and attach a fresh controlled-browser screenshot.
- [ ] Enable GitHub Issues and private vulnerability reporting.

## Channel priority

### 1. Official OpenAI Plugins Directory — highest-value destination

This is the actual install surface for Codex users. Submit the skills-only plugin through the [OpenAI plugin submission portal](https://platform.openai.com/plugins) using [openai-submission.md](openai-submission.md). OpenAI's current process requires a verified developer or business identity, Apps Management write access, listing/legal assets, starter prompts, exactly five positive tests, and three negative tests.

Success criterion: approval and publication in the universal plugin directory, not merely a submitted draft.

### 2. Codex ecosystem discovery — launch week

These audiences already understand the problem and can install the plugin.

1. Submit a PR to [Awesome Codex Plugins](https://github.com/hashgraph-online/awesome-codex-plugins) after its required scanner CI passes. The list currently requires a score of at least 80/130, no high or critical findings, a public repo, icon, security policy, license, lockfile, and scanner workflow.
2. Post a **Show and tell** discussion in [openai/codex Discussions](https://github.com/openai/codex/discussions). This category already hosts Codex plugins and developer tools.
3. Post with the **Showcase** flair in [r/codex](https://www.reddit.com/r/codex/). Recent posts explicitly invite Codex plugin submissions, so the audience fit is direct.

Success criterion: ten clean installs by people outside the maintainer's machine, with at least three real TUI projects validated.

### 3. Broader developer-tool communities — after clean-install proof

1. **Show HN:** strong fit once the repository is public and the install is genuinely runnable. The [official Show HN rules](https://news.ycombinator.com/showhn.html) require something the community can try without a signup barrier. The [HN guidelines](https://news.ycombinator.com/newsguidelines.html) prohibit generated or AI-edited comments, so the maintainer must write the submission discussion and replies personally. Use the facts below as notes, not paste-ready copy.
2. **r/commandline:** high TUI audience fit, but it uses a mandatory read-the-rules gate and routinely removes posts that have not completed it. Read and acknowledge the current rules before submitting; use the Terminal User Interface flair and lead with the technical workflow.
3. **Lobsters:** good technical audience only if the maintainer is already an established participant. Its [community rules](https://lobste.rs/about) ask that self-promotion remain below a quarter of activity, and new accounts cannot submit unseen domains or use `show`/`announce` tags. Do not create an account solely to launch.

Success criterion: substantive implementation feedback and contributors, not raw clicks.

### 4. Indie Hackers — supporting channel, not the launch center

Indie Hackers is useful for the build story and peer feedback, but its audience is broader than the actual buyer/user profile. Publish after there is launch data. Angle: “I found a missing visual-validation layer for coding agents and deliberately built on xterm.js + node-pty instead of making another terminal emulator.” Include real install counts, failures, and changes prompted by early users.

Do not reuse the Codex showcase copy or frame the post as a generic product announcement.

### 5. Defer Product Hunt

Product Hunt is not the first audience for a local, open-source Codex plugin. Reconsider only after official-directory approval, a short demo clip, cross-platform CI, and evidence of repeat use. At that point it can amplify a stable release rather than test basic installability.

## Prepared launch copy

### openai/codex GitHub Discussion

**Title:** Codex TUI Proof — visual validation for real TUIs in the in-app browser

**Body:**

> I built Codex TUI Proof for the point where a coding task ends with “the tests pass” but the interactive terminal UI still needs to be seen and driven.
>
> It packages a real local PTY, deterministic xterm.js rendering, keyboard interaction through Codex's in-app browser, controlled-tab screenshots, and structured JSONL evidence. The skill has a hard boundary against Computer Use and desktop terminal takeover.
>
> Install:
>
> `codex plugin marketplace add bnc4vk/codex-tui-proof`
>
> `codex plugin add codex-tui-proof@codex-tui-proof`
>
> Then start a new task and ask: `$validate-tui-in-codex visually validate this TUI at 100x30 and attach screenshots.`
>
> I would especially value feedback from people maintaining interactive CLIs: which keyboard flows and evidence fields would make this useful in your review loop?

### r/codex

**Title:** I made a Codex plugin that visually validates real TUIs without desktop takeover

**Body:**

> Codex TUI Proof runs the actual command in a local PTY, exposes it in Codex's in-app browser, and lets the agent interact, take a screenshot, and report session evidence. It never falls back to Computer Use.
>
> It is open source and installs as a Codex marketplace plugin. The first run installs three locked local dependencies; recordings stay on the machine.
>
> Repo and install: https://github.com/bnc4vk/codex-tui-proof
>
> I built it for TUI layout, colors, menus, resize behavior, prompts, and keyboard-flow proof. If you maintain an interactive CLI, I would like to hear which app I should test next.

### r/commandline

Use only after completing the subreddit rule acknowledgement.

**Title:** A local PTY bridge that lets Codex visually validate TUIs in its browser

**Body:**

> I wanted a coding agent to validate a TUI without automating my desktop or pretending ANSI snapshots were the rendered interface. This uses node-pty, xterm.js, and a localhost WebSocket bridge so Codex can drive the real process in its in-app browser.
>
> The opinionated part is the evidence contract: fixed geometry, stable selectors, screenshots from the controlled tab, JSONL I/O/lifecycle recording, and an explicit no-desktop-automation boundary.
>
> Source: https://github.com/bnc4vk/codex-tui-proof
>
> I would value critique from TUI maintainers, especially around terminal-emulator edge cases this approach should state more clearly.

### Awesome Codex Plugins PR entry

```md
- [Codex TUI Proof](https://github.com/bnc4vk/codex-tui-proof) - Visually validate real local terminal UIs in Codex's in-app browser with screenshots and session evidence.
```

Include the public Runtime CI URL, HOL scanner run URL, scanner score, and repository URL in the PR description.

## Human-authored Show HN notes

Do not paste AI-authored prose into HN comments. In the maintainer's own words, cover:

- the concrete failure mode that motivated the project;
- why existing headless TUI tools did not provide the Codex review loop;
- the deliberately small xterm.js + node-pty + WebSocket architecture;
- the no-Computer-Use and localhost-only boundaries;
- the first-run npm tradeoff and recording privacy caveat;
- what feedback would change the project.

A factual title concept is: “Show HN: Codex TUI Proof – visual validation for terminal UIs in Codex.”

## Launch order

1. Publish GitHub repo and create `v0.1.0` release.
2. Verify a clean Git marketplace install and fresh-task invocation.
3. Submit the OpenAI Plugins Directory draft.
4. Let CI and the HOL scanner complete; submit the Awesome Codex Plugins PR.
5. Publish openai/codex Discussion and r/codex showcase on the same day; stay available for replies.
6. Fix install blockers before expanding reach.
7. Publish Show HN and r/commandline separately after external clean-install confirmation.
8. Write the Indie Hackers build story once real adoption data exists.

## Metrics worth tracking

- successful clean installs / attempted clean installs;
- projects and TUI frameworks validated;
- proof sessions completed without manual intervention;
- issue-to-fix time for install failures;
- repeat users and contributed fixtures;
- official-directory approval and community-list inclusion.

Avoid optimizing for impressions, launch-board ranks, or synchronized upvotes.
