export const DAYS = [
 {d:1,t:"First cinematic frame",m:45,goal:"One still that looks photographed, not generated.",
  steps:["Pick one subject and one moment. Not a story, a single instant.","Write the prompt in this order: subject, action, setting, light, lens, mood.","Generate four versions and keep one. Delete the rest.","Write down which words changed the picture the most."],
  task:"Post your frame with the exact prompt that made it.",miss:"Stacking adjectives. Ten style words fight each other. Three concrete nouns win."},
 {d:2,t:"Light and lens",m:45,goal:"Control the look on purpose instead of by luck.",
  steps:["Remake yesterday's frame three times, changing only the light: window light, golden hour, a single lamp.","Remake it twice more, changing only the lens: wide 24mm, then portrait 85mm.","Lay the five frames side by side and name what each change did to the mood."],
  task:"Pick the light and lens you will use for your whole film.",miss:"Changing light and lens together. You learn nothing about either."},
 {d:3,t:"Make it move",m:60,goal:"Turn a still into a clip with one clean motion.",
  steps:["Use your best still as the first frame of an image to video generation.","Describe only the motion. The picture already holds the look.","Ask for one motion per clip: a turn of the head, a step forward, smoke rising.","Run three takes and keep the one with the fewest broken details."],
  task:"One five second clip where nothing melts.",miss:"Asking for two actions in one clip. The model blends them into mush."},
 {d:4,t:"Camera language",m:45,goal:"Move the camera with intent.",
  steps:["Make three clips from one still: slow push in, slow pan, slow orbit.","Rule for now: either the subject moves or the camera moves, not both.","Match the move to the feeling. Push in for focus, pull out for loneliness, orbit for power."],
  task:"Choose the two camera moves your film will use most.",miss:"Fast moves. Slow moves hide errors and look expensive."},
 {d:5,t:"One character in every scene",m:60,goal:"The same face and costume from the first shot to the last.",
  steps:["Write a character descriptor: age, build, face, hair, wardrobe, one signature object.","Generate a character sheet: face close up, front view, three quarter view, full body.","Reuse the sheet as a reference image in every new shot.","Copy the descriptor word for word. Never paraphrase it."],
  task:"Three different shots where it is clearly the same person.",miss:"Rewording the descriptor each time. New words make a new person."},
 {d:6,t:"Locations that match",m:45,goal:"A place the viewer believes across several angles.",
  steps:["Generate one master wide shot of your location.","Use it as the reference for a medium angle and a detail angle.","Lock the time of day and the weather in every prompt."],
  task:"Wide, medium and detail of one location that agree with each other.",miss:"Letting the sun move between shots."},
 {d:7,t:"First scene, posted for feedback",m:60,goal:"Three shots cut together that read as one moment.",
  steps:["Shoot a wide, a medium and a close up of the same action.","Cut them in that order. Trim each to the movement.","Post it in the Arena and ask one specific question."],
  task:"A fifteen second scene, shared.",miss:"Asking is this good. Ask where it looks fake."},
 {d:8,t:"Story in five beats",m:45,goal:"A short film plan you can actually finish.",
  steps:["Write five beats: hook, want, obstacle, turn, final image.","Turn the beats into a shot list of ten to twelve shots.","Mark the three shots the film cannot live without. They get the most takes."],
  task:"A numbered shot list with one line per shot.",miss:"Writing a feature. Sixty seconds is a film."},
 {d:9,t:"Shoot the film, first half",m:60,goal:"Half the shot list generated with keepers chosen.",
  steps:["Generate stills for shots one to six from your character and location references.","Animate each with three takes.","Pick keepers the same day and note the settings that worked."],
  task:"Six selected clips.",miss:"Generating everything before choosing anything."},
 {d:10,t:"Sound, music and edit",m:60,goal:"A rough cut that already feels like a film.",
  steps:["Lay the selected clips on a timeline in order.","Add voice or narration first and lock its timing.","Add music, then room sound, then two or three spot effects.","Cut on movement so edits disappear."],
  task:"A rough cut of the first half with sound.",miss:"Adding music last. Sound decides the edit."},
 {d:11,t:"Shoot the film, second half",m:60,goal:"The remaining shots generated and selected.",
  steps:["Generate and animate shots seven to twelve.","Check each new shot against the last shot of the rough cut for light and direction.","Drop the selects into the timeline."],
  task:"A complete assembly from first shot to last.",miss:"Forgetting screen direction. A character walking left should keep walking left."},
 {d:12,t:"Fix and polish",m:60,goal:"The three weakest shots replaced and one look across the film.",
  steps:["Watch on a phone without pausing. Note every moment you flinch.","Regenerate the three worst shots from a corrected still.","Upscale only the final selects.","Apply one colour grade to everything."],
  task:"A picture locked cut.",miss:"Polishing shots that should be cut."},
 {d:13,t:"Title, poster and cut down",m:45,goal:"The film packaged to be watched.",
  steps:["Remove a tenth of the runtime.","Add a title card and credits.","Pick a poster frame.","Cut a vertical teaser of ten to fifteen seconds."],
  task:"Final film, poster frame and teaser.",miss:"A slow first three seconds."},
 {d:14,t:"Premiere",m:30,goal:"Published, in your portfolio, with the method saved.",
  steps:["Publish the film.","Add it to your Folio with a two line breakdown.","Save your descriptors and best prompts in Prompts so the next film starts faster."],
  task:"A public link.",miss:"Waiting for perfect. Shipped beats perfect."}
];
export const TRACKS = [
 {k:"films",t:"Films",l:[["Consistency across a full film","Reference sheets, locked descriptors and a continuity check before every batch."],["Dialogue and lip sync","Write lines short, generate voice first, then sync the face to it."],["Scene coverage","Wide, medium and close for every scene so the edit has choices."],["Festival pack","Synopsis, poster, stills, credits and a clean export."]]},
 {k:"ads",t:"Ads",l:[["Product hero shot","Hard light, dark ground, one motion. The product is the only star."],["Beauty that holds up","True skin texture, soft light, no plastic faces."],["Fashion movement","Fabric, wind and walk cycles that stay on model."],["Social cut downs","One master cut delivered in three ratios with safe areas."]]},
 {k:"paid",t:"Get paid",l:[["A portfolio that sells one skill","Three strong pieces in one niche beat twelve mixed ones."],["Pricing a thirty second spot","Count shots, revisions and usage. Quote the job, not the hour."],["A pitch that gets replies","Their problem, your proof, one next step. Under ninety words."],["Revisions without losing money","Two rounds in the quote. Everything after is a change order."]]},
 {k:"micro",t:"Micro drama",l:[["Hook in two seconds","Start on the conflict. Explain later, or never."],["Cliffhanger endings","End each episode one beat before the answer."],["Vertical framing","Faces high, hands in frame, text clear of the interface."],["Series bible","Ten episodes on one page: characters, secret, escalation."]]}
];
export const STARTERS = [
 ["Film","Dawn river crossing","Wide shot of a lone ferryman poling a narrow boat across a misty river at dawn, soft blue light, low fog on the water, 35mm lens, muted palette, quiet and patient mood"],
 ["Film","Kitchen table close up","Close up of a woman in her sixties holding back words at a kitchen table, single window light from the left, shallow focus, 85mm lens, warm lamp behind her, restrained mood"],
 ["Film","Night market tracking","Tracking shot following a boy carrying a paper lantern through a crowded night market, camera at shoulder height moving forward, neon signs and steam, he looks back once"],
 ["Film","Temple steps reveal","Slow crane up from worn stone steps to reveal a hilltop temple at golden hour, pilgrims climbing, long shadows, dust hanging in the light"],
 ["Ads","Sneaker landing","Low angle product shot of a white running shoe landing on wet asphalt, water splashing outward in slow motion, hard backlight, dark background, 50mm lens"],
 ["Ads","Espresso pour","Macro shot of espresso pouring into a clear glass cup, crema swirling, single hard side light, black backdrop, steam rising slowly"],
 ["Ads","Phone reveal vertical","Vertical 9:16 shot of a hand lifting a matte black phone from a slim box on a concrete table, soft top light, slow push in, clean minimal set"],
 ["Beauty","Serum drop","Extreme close up of a glass dropper releasing one drop of golden serum onto fingertips, soft diffused light, pale stone surface, true skin texture with visible pores"],
 ["Beauty","Red lip portrait","Beauty portrait, medium close up, model turning slowly toward camera, soft overhead light, deep red lip, neutral backdrop, natural skin texture, 85mm lens"],
 ["Product","Watch on basalt","Close up of a steel wristwatch resting on wet black basalt, a thin stream of water running past, cool hard light from the side, slow orbit"],
 ["Product","Perfume in water","Glass perfume bottle half submerged in still water, ripples spreading from a single drop, soft dawn light, pale green reflections, locked off camera"],
 ["Micro drama","The message","Vertical 9:16 medium close up of a young man reading a phone message in a parked car at night, dashboard glow on his face, he exhales and starts the engine"],
 ["Micro drama","Doorway cliffhanger","Vertical 9:16 over the shoulder shot of a woman opening her apartment door to someone she did not expect, hallway light spilling in, she freezes"],
 ["Micro drama","Rooftop confession","Vertical 9:16 two shot on a city rooftop at dusk, wind moving their hair, one of them turns away before speaking, slow push in"]
];
export const BRIEFS = [
 ["One location, three shots","Tell a moment using a wide, a medium and a close up of the same place."],
 ["Product in ten seconds","One product, one motion, one light. Ten seconds or less."],
 ["Same character, two worlds","Put one consistent character in two opposite settings."],
 ["A myth in thirty seconds","Retell any myth or legend in half a minute."],
 ["Vertical cliffhanger","A 9:16 scene that ends one beat before the answer."],
 ["No dialogue, one emotion","Make the viewer feel one thing without a single word."],
 ["Beauty with true skin","A beauty close up where the skin looks like skin."],
 ["Remake your first frame","Take your Day 1 still and make it again with everything you know now."]
];
export const SIZES =["Wide shot","Medium shot","Medium close up","Close up","Extreme close up","Over the shoulder shot","Low angle shot","Top down shot"];
export const LENSES =["24mm wide lens","35mm lens","50mm lens","85mm portrait lens","macro lens"];
export const LIGHTS =["soft window light","golden hour sun","overcast soft light","hard noon sun","single warm lamp","moonlight","firelight","neon signs"];
export const MOVES =["locked off camera","slow push in","slow pull out","slow pan","slow orbit","tracking forward","handheld","crane up"];
export const JOB_STATUS =["Saved","Pitched","Talking","Won","Passed"];
export const PCATS =["Film","Ads","Beauty","Product","Micro drama","Mine","Community"];
