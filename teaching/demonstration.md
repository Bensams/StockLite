# Concise live demonstration script

## Session 1 (20 minutes)
0–3: show architecture and private bucket settings, with keys hidden. Say: “The public key identifies the project; the verified user and policies authorize access.”
3–8: select a real small PNG; inspect POST /api/photos multipart, `{path}`, subsequent product POST, saved image_path and signed image request. Explain generated filename and owner folder.
8–13: replace the image; show new reference saved before old cleanup. Remove it; show null reference before deletion. Ask why one transaction cannot cover both services.
13–17: activate storage defect in development/restart. Show visible 503 and unchanged form. Label it simulated. Explicitly choose no selected photo or reset/retry.
17–20: reset, rerun allowed upload, explain the narrow adapter students complete.

## Session 2 (20 minutes)
0–2: confirm blank teaching mode, own group account, unique demo SKU.
2–7: create Blue ballpoint pens ₱12.50 opening 10; show opening history. IN 5 “Received five”; OUT 3 “Released three”.
7–10: reload: 12, with 0→10, 10→15, 15→12. Show dashboard. Attempt OUT 13; explain 409 and unchanged data.
10–15: activate preview defect, use a fresh 10-unit product. Enter 5: 105 preview. Break at expression; compare string and number. Submit: DB correctly stores 15. If time favors mismatch instead, show amount versus quantity and 422.
15–18: clear flag/restart; repeat corrected preview. Inspect safe log request ID and Network payload; no secrets on screen.
18–20: map observation → layer → root cause → correction → regression. Hand over worksheet.

## Session 3 (20-minute configuration block + 45-minute deployment block)
Configuration: compare .env.example to Vercel variable names without displaying values; inspect Node 24, package lock, scripts, project root, private bucket and Auth origin. Explain public versus privileged keys and why production ignores teaching flags.
Deployment block: if authorized/access available, import approved repository, build and inspect deployment, then execute smoke checks. Otherwise run local production build/start and complete the simulation worksheet. Say “local production build verified; hosted deployment not performed,” not “deployed.” Record actual blockers.
Finish: demonstrate sign-in → persisted product → photo → 10→15→12 → sign-out → account B denial. Capture only actual sanitized evidence.
