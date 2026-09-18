/* Editorial revision for readers targeting 800–900L; NOT a Lexile measurement.
 * Source snapshot is immutable. Run: node tools/relevel_questions.js
 * --check compares the reproducible result without writing any files.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert/strict");
const ROOT = path.resolve(__dirname, "..");
const sourcePath = path.join(ROOT, "data/questions.before-800-900.js");
const originalText = fs.readFileSync(sourcePath, "utf8");
const context = { window: {} };
vm.runInNewContext(originalText, context, { timeout: 1000 });
const before = JSON.parse(JSON.stringify(context.window.QUESTION_BANK));
const bank = structuredClone(before);
const byId = new Map(bank.map(q => [q.id, q]));
const passageChanges = new Map();
const reasons = new Map();
function note(q, reason) {
  if (!reasons.has(q.id)) reasons.set(q.id, new Set());
  reasons.get(q.id).add(reason);
}
function setPassage(firstId, text) {
  const p = byId.get(firstId).passage;
  passageChanges.set(p, text);
}
function revise(id, stem, correct, wrong, explanation, tags, difficulty = 3) {
  const q = byId.get(id);
  assert(q, id);
  assert.equal(wrong.length, 3);
  // Keep the original answer position and thus the existing balanced distribution.
  const choices = [...wrong];
  choices.splice(q.answer, 0, correct);
  Object.assign(q, { stem, choices, explanation, tags, difficulty });
  note(q, "질문·보기·해설 재작성");
}
const cap = s => s[0].toUpperCase() + s.slice(1);

// Handwritten opening units: preserve story, question evidence, and shared passages.
setPassage("adv_0001", "While helping their grandmother clear her attic, Mina and her brother Jun discovered an old map beneath a pile of magazines. It showed a small island, with a large X beside a tall tree near the shore. Jun immediately imagined a box of treasure waiting under the tree, although Mina thought the mark might show an ordinary meeting place. She laughed at his excitement, then carefully put the map in her backpack. Before making any plans to visit the island, she wanted to ask their grandmother who had drawn it and why she had kept it for so many years.");
setPassage("adv_0003", "Tom: Have you finished the science project, or are you still working on the volcano model?\nSara: The research is ready, but I haven't built the model yet. I'm worried that it won't stand up.\nTom: I can help you after lunch. When I made one last year, I learned that a wide base keeps it steady.\nSara: That would be useful. Let's meet in the art room, where we can spread out the materials.\nTom: Bring your drawing so we can follow your plan.\nSara: Thanks. With your advice, I should be able to finish before tomorrow's class.");
setPassage("adv_0005", "The school garden club meets every Wednesday to care for vegetables behind the science building. Last week, the members planted tomatoes and carrots in separate rows so they could compare how the plants grow. When they returned to check the garden, they noticed that several young leaves had disappeared. Small tracks in the soil suggested that rabbits had visited during the night. This week, the members will build a low fence around the vegetables to keep the rabbits away. Their teacher explained that protecting the plants is just as important as watering them if the club hopes to enjoy a harvest.");
setPassage("adv_0007", "Dear students,\nOur field trip to the city museum is on Friday, and we need everyone to follow the same schedule. Although the bus leaves at 9 a.m. sharp, please arrive at school by 8:40 so we can check attendance before boarding. Bring your lunch and a notebook for recording details about the objects you find interesting. We will visit the gift shop after the guided tour, but remember that it accepts cash only; credit cards cannot be used there. You may bring a small amount of money, although buying a souvenir is entirely optional.\n- Mr. Park");
setPassage("adv_0009", "Leo was nervous before the swimming race, even though he had practiced regularly for several weeks. As he watched the other swimmers prepare, he began to worry that he would forget his breathing pattern. His coach noticed his tense shoulders and reminded him to focus on the movements he already knew. \"Breathe every three strokes,\" she said, pointing to the way his arms moved through the water. Leo nodded and took a deep breath before stepping onto the starting block. He still felt nervous, but the familiar advice gave him a clear plan for the first part of the race.");
setPassage("adv_0011", "Emma: The library is holding a book-reading contest this month, and I think we should take part.\nNoah: I like the idea, but do you have to read more books than everyone else to receive anything?\nEmma: No. The winner gets a $30 gift card, while everyone who reads five books receives a free bookmark.\nNoah: I'm in. I've already read two books this month, so I have a useful start.\nEmma: Remember to record each title on the form at the library desk.\nNoah: I'll collect a form tomorrow and ask whether the books I've finished can count.");
setPassage("adv_0013", "When a honeybee discovers flowers with plenty of nectar, it can share the location without leading every other bee there. After returning to the hive, the home where its colony lives, the bee performs a special dance. Its movements provide information about the direction and distance of the flowers, helping other bees decide where to search. This system is useful because a good source of nectar may be some distance from the hive. Rather than exploring the whole area without a plan, the other bees can use the dancer's message to guide their journey and bring food back to the colony.");
setPassage("adv_0015", "Jake's soccer team lost the game 3 to 1, and the players sat quietly on the bus home. Several of them could remember only their mistakes, although they had also worked well together during parts of the match. Their coach stood up and reminded them that they had made their best passes of the season. She explained that a disappointing score did not mean every part of their performance had been poor. \"Next week, we practice corner kicks,\" she added, giving the team something specific to improve. The players started to smile again because they could see a useful way forward.");
setPassage("adv_0017", "NOTICE: The school swimming pool will be closed from Monday to Wednesday while workers clean the building. Swimming lessons will continue during this period, but students should report to the gym instead of the pool. Their teacher will lead stretching exercises that help them prepare for future swimming lessons. Please bring suitable clothes for indoor exercise, and follow your usual class schedule unless your teacher announces a change. The pool will reopen on Thursday morning, when students can return to their regular swimming activities. Keeping lessons on the schedule allows the class to continue practicing while the pool is unavailable.");

function rewriteBasic(p) {
  let m;
  if ((m = p.match(/^(\w+) could not find (his|her) (.+?) on (\w+) morning\. (He|She) looked.*?Finally, (?:his|her) (.+?) found it (.+?)\./))) {
    const [, n, his, item, day, He, helper, place] = m;
    return `On ${day} morning, ${n} was preparing to leave when ${He.toLowerCase()} realized that ${his} ${item} was missing. Although ${He.toLowerCase()} searched under the bed and behind the desk, neither place held the missing item. ${He} even checked the bathroom before trying to remember where ${He.toLowerCase()} had been the previous evening. Finally, ${his} ${helper} found it ${place}, away from the places already searched. Relieved that the search was over, ${n} laughed and said, "I will put it in my backpack tonight!" Preparing everything the evening before seemed much easier than another hurried search in the morning.`;
  }
  if ((m = p.match(/^(\w+) was (\w+) before the (.+?)\. (His|Her) teacher.*?had won (\w+) prize/))) {
    const [, n, feel, event, His, prize] = m, he = His === "His" ? "he" : "she";
    return `${n} was ${feel} before the ${event}, especially after noticing how many people had come to watch. ${His} teacher patted ${His.toLowerCase()} shoulder and said, "Remember what we practiced. Take a deep breath." Rather than thinking about the other competitors, ${n} tried to concentrate on the skills developed during practice. The event seemed to pass quickly once ${he} began, and the audience applauded when it was over. When the results were announced, ${n} learned that ${he} had won ${prize} prize. ${cap(he)} could not stop smiling, partly because the result showed that the careful preparation had been worthwhile.`;
  }
  if ((m = p.match(/^(\w+): Are you coming to the (.+?) on (\w+)\?\n(\w+): I want to, but I have to (.+?) first\.\n\w+: It starts at (.+?)\. You have enough time\.\n\w+: OK! Let's meet at the (.+?) at (.+?)\.$/))) {
    const [, a, event, day, b, chore, start, place, meet] = m;
    return `${a}: Are you coming to the ${event} on ${day}? I would rather go with a friend than arrive alone.\n${b}: I'd like to, although I have to ${chore} first. I promised to finish that before going out.\n${a}: It starts at ${start.replace(/\.$/, "")}. If you begin your task early, you should still have enough time.\n${b}: Then let's meet at the ${place} at ${meet.replace(/\.$/, "")}, before the event begins.\n${a}: That gives us time to get there together.\n${b}: Good. I'll let you know if my task takes longer than I expect.`;
  }
  if (p.startsWith("NOTICE:")) {
    return p.replace("school school library", "school library")
      .replace(". Classes that use", ". Although the building will be unavailable, regular lessons will continue at their usual times. Classes that use")
      + " Please check the notice before leaving your classroom, since the temporary arrangement may involve a different location. Teachers will explain what materials students should bring. Following these instructions will help everyone continue learning while the work is completed.";
  }
  if (p.startsWith("Dear students,")) {
    return p.replace(/The bus leaves at (.*?) sharp, so please arrive at school by (.*?)\./, "Although the bus leaves at $1 sharp, please arrive at school by $2 so your teacher can check attendance before anyone boards.")
      .replace(/\n- /, " During the visit, stay with your assigned group and record details that you can share in class afterward. These notes will help you explain what you learned instead of simply listing the things you saw.\n- ");
  }
  if (p.startsWith("LIBRARY NEWS:")) {
    return p.replace(" Children can borrow", " A librarian will read aloud and invite children to discuss why the characters make particular choices. Children can borrow")
      .replace("Please bring your library card.", "Please bring your library card, which is needed to check out books even if you have attended before. Families are welcome to join the discussion, but younger children should sit near an adult so everyone can follow the story without interruption.");
  }
  if (p.includes("Hello! My name is")) {
    return p.replace("Hello! My name is", "Our teachers have arranged this exchange so we can learn about everyday life in another place. My name is")
      .replace("What is your favorite subject? Please write back soon!", "Although our schools may have different schedules, I wonder whether we enjoy similar activities. What is your favorite subject, and what makes those lessons interesting to you? Please describe a typical school day when you write back, so I can compare it with mine.");
  }
  if (p.includes("Look at this poster!")) {
    const names = [...p.matchAll(/(?:^|\n)(\w+):/g)].map(x => x[1]);
    return p.replace("Cool! What's the prize?", "I'd like to take part, but I don't think I could win. Is there anything for ordinary participants?")
      .replace("The winner gets", "There are two kinds of rewards. The winner gets")
      .replace("I'm in!", "I'm in! That sounds worthwhile even if someone else wins.")
      + `\n${names[0]}: Read the instructions carefully before entering, because you must complete the required activity to qualify.\n${names[1]}: I'll check the details this afternoon and make a plan before I begin.`;
  }
  if (p.includes("'s family went to")) {
    return p.replace(/(Last \w+, .*?went to the .*?\.) /, "$1 They had only part of the day available, so they needed to agree on a sensible order for their activities. ")
      .replace("They decided to", "After discussing both suggestions, they decided to")
      .replace("Everyone had a great time.", "The plan allowed both children to enjoy something they had chosen without spending the visit arguing. By the time they left, everyone agreed that sharing the decision had made the day more enjoyable.");
  }
  if (p.includes("On the way home, ")) {
    return p.replace("On the way home,", "Although there had been some successful moments, the disappointment was difficult to forget. On the way home,")
      .replace("Next week, let's", "We can build on that success. Next week, let's")
      + " The encouraging words did not change what had happened, but they showed that one poor result did not erase all the progress made in practice. There was still something useful to learn from the experience.";
  }
  return null;
}

// Instructions retain their order but now explain why each step matters.
const howto = {
  "bookmark": "In the school craft club, students are making bookmarks that will last longer than a thin scrap of paper. First, cut a strip of thick paper narrow enough to fit inside a book. Next, draw your favorite animal on it, leaving some space near the upper edge. Finally, tape a ribbon to the top so that it can hang outside the book when the pages are closed. Press the tape firmly before using the bookmark, since a loose ribbon can fall off. The finished design should help you find your place without folding or damaging the pages.",
  "lemonade": "The cooking club is preparing lemonade for an afternoon meeting, using a recipe that everyone can follow. First, squeeze three lemons into a jug, keeping the seeds out of the juice. Next, add cold water and sugar, then check the flavor before deciding whether it needs anything else. Finally, stir well and add ice just before serving, so the drink stays cool. Adding too much water at the beginning would make the lemon flavor difficult to notice. Following the steps in order allows the group to adjust the mixture gradually instead of having to start again.",
  "jam sandwich": "For a quick picnic lunch, the students are making sandwiches with bread, jam, and a banana. First, spread jam on a slice of bread, taking it close to the edges without letting it drip. Next, add some banana slices in a single layer so the filling stays even. Finally, put another slice of bread on top and press gently to hold everything together. If too much filling is added, it may fall out when someone takes a bite. Wrap the finished sandwich carefully so that it keeps its shape on the journey to the picnic area.",
  "seed pot": "The class is using paper cups to observe how seeds grow, and the teacher has already made small drainage holes in each cup. First, fill a paper cup with soil, leaving a little space below the edge. Next, push the seed gently into the soil and cover it according to the instructions on the packet. Finally, check the soil each day and add a little water when it feels dry. Avoid filling the cup with water, because extra water must be able to drain away. Label the cup and record any changes so you can compare your observations with a partner's.",
  "sock puppet": "The drama club is making simple puppets for a short performance, using clean socks and buttons from its craft box. First, put a clean sock on your hand to see where the puppet's face should be. Next, remove the sock and glue on two button eyes, keeping them above the place where your fingers bend. Finally, draw a mouth with a marker and allow the glue to dry before using the puppet. Moving your fingers will make the character appear to speak. A clear face matters more than extra decorations because the audience needs to recognize the puppet's expression.",
  "fruit salad": "For the class picnic, each group will prepare fruit salad using fresh fruit and plain yogurt. First, wash the fruit well so that it is ready to prepare. Next, cut it into small pieces of similar size, asking an adult for help when needed. Finally, mix everything with yogurt, turning the pieces gently instead of pressing them down. If the fruit is crushed during mixing, the salad will lose its fresh appearance. Keep the finished salad cool until it is served, and use a clean spoon so that everyone can share it at the picnic.",
  "paper airplane": "The science club is comparing paper airplanes to find out how careful folding affects their flight. First, fold a sheet of paper in half the long way, then open it to reveal the center line. Next, fold the top corners down to the middle so that both sides meet along that line. Finally, close the plane along the original fold and fold the wings down on both sides. Check that the wings match before testing it in a clear indoor space. After each flight, change only one small detail so that you can tell which adjustment made a difference.",
  "paper boat": "During an art lesson, students are following a picture guide to make a small paper boat. First, fold a square piece of paper in half, matching the edges carefully. Next, follow the guide to fold the corners toward the middle and shape the sides. Finally, open the bottom and press it flat so the model can stand on the desk. Compare each fold with the picture before moving to the next stage, since a crooked edge can affect the finished shape. The class will display the boats on blue paper instead of placing them in water, which would soften the models."
};

// Revised factual units avoid unsupported absolute claims and explain vocabulary in context.
const animalTexts = [
  ["Dolphins are", "Dolphins live in an environment where sound can carry information that is difficult to see. They communicate with clicks and whistles, which help them stay in contact while moving through the water. A dolphin also has an unusual way of resting: one half of its brain can remain active while the other half sleeps. During this kind of rest, one eye may stay open to watch for danger. Although this looks different from human sleep, it allows the animal to remain aware of its surroundings. Studying these behaviors helps us understand how life in the ocean requires different solutions to everyday problems."],
  ["Camels are", "A camel's body has several features that help it live in the desert, where food can be difficult to find. Its humps store fat rather than water, providing a reserve that the animal can use when it travels without eating. Long eyelashes help keep blowing sand out of its eyes, allowing it to continue moving when the air becomes dusty. These features perform different jobs, but both help the camel deal with the conditions around it. Looking closely at the animal shows why a shape that seems unusual to us can be useful in the place where it lives."],
  ["Penguins are", "Although penguins are birds, they cannot fly through the air like many other birds do. Their bodies are suited to swimming, which allows them to search for food below the water's surface. Emperor penguins also have an unusual way of protecting an egg in a very cold environment. After the female lays it, the male balances it on his feet and covers it with a fold of skin. This keeps the egg away from the ice while the female goes to sea to feed. The parents have different tasks during this period, but both contribute to their chick's survival."],
  ["Owls hunt", "Many owls hunt at night, when small movements and sounds can be more useful than bright colors. Their necks allow them to turn their heads a long way to look behind them, although they cannot turn them in a complete circle. Special features of their wing feathers reduce the sound made during flight. As a result, an owl can approach an animal without making the loud flapping noise that might warn it of danger. These features work together: the head movement helps the bird watch its surroundings, while quiet flight helps it move closer to possible food."],
  ["Elephants use", "An elephant's trunk is useful for tasks that require very different amounts of strength. The animal can use it like a hand to pick up a tiny peanut or move a heavy log. Its large ears have another job: when an elephant flaps them on a hot day, the movement helps it stay cool. A visitor might notice only the animal's enormous size, but these details reveal how different parts of its body are used. Watching several actions, rather than just one, gives a clearer picture of how an elephant handles ordinary needs such as feeding and controlling body temperature."],
  ["Sea turtles travel", "Sea turtles may travel thousands of kilometers through the ocean, yet many females return to the region where they hatched when they are ready to lay eggs. A mother turtle comes onto a beach and places her eggs in the sand rather than leaving them in the sea. In this passage, return means to go back to a place visited before. The journey connects the turtle's adult life in the ocean with the shore where its life began. Because both places are part of its life cycle, changes on a nesting beach can matter even to an animal that spends most of its time at sea."],
  ["An octopus has", "An octopus has three hearts and blue blood, but its ability to avoid enemies may be even more noticeable to an observer. Many octopuses can quickly change the appearance of their skin, allowing them to blend with nearby rocks or sand. Changing color in this way makes the animal harder to see when danger approaches. Its soft body also allows it to squeeze into small spaces that would be difficult for an animal with a rigid skeleton to enter. These different forms of protection help explain why watching an octopus carefully can reveal much more than counting its arms."],
  ["Kangaroos carry", "A young kangaroo begins life much smaller and less developed than the adults that visitors usually notice. The baby, called a joey, continues growing inside a pouch on its mother's body. This protected space allows the mother to carry her young as she moves around. Adult kangaroos are known for hopping, using their strong back legs to travel across open ground. A joey may later leave the pouch for short periods before becoming more independent. Understanding the purpose of the pouch helps explain why the mother and baby remain closely connected even while the adult searches for food."],
  ["Polar bears look", "A polar bear may appear white against the snow, but the skin beneath its fur is actually black. The difference between its outer appearance and its skin is easy to miss if a person looks only at a photograph. Polar bears are also strong swimmers and use a powerful sense of smell when searching for food. They can detect the scent of a seal from far away, even when the animal is not immediately visible. These features show why observing an animal's color alone tells us very little about the ways it finds food and moves through its environment."],
  ["Giraffes are", "A giraffe can reach leaves that are far above the heads of many other animals. Its height is useful, but its long tongue also plays an important part in feeding. The tongue can wrap around leaves and pull them from branches, giving the giraffe a way to gather food without using its front legs. Giraffes also rest in short periods, and they sometimes lie down rather than remaining on their feet all the time. A brief visit may therefore show only one part of their behavior. Repeated observations give a fuller picture of how they feed, move, and rest."],
  ["Ants are", "An ant may be tiny, but its size does not prevent it from moving objects that seem large beside its body. Some ants can carry loads many times their own weight, which helps a colony collect food efficiently. Finding the way back is another important task. Ants can leave a chemical trail, a special smell on the ground that other ants follow toward food. The trail allows members of the colony to use information left by earlier workers. What looks like a simple line of insects is therefore connected by signals that people usually cannot notice without careful study."],
  ["Bats are", "Bats are mammals that can truly fly, and many search for insects after daylight has faded. Instead of depending only on sight, these bats produce high sounds and listen for the echoes that return from nearby objects. The returning sounds provide clues about where an insect is moving, helping a bat find food in the dark. During the day, many bats rest while hanging upside down in a sheltered place. Their unusual posture may attract attention, but their use of sound is equally important. It shows how an animal can gather information about its surroundings in a way that differs from ours."],
  ["Chameleons can", "A chameleon's changing skin color is only one of the features that makes it interesting to observe. Its color may change when its temperature or mood changes, such as when it becomes cold or angry. Its eyes can also move in different directions at the same time, allowing it to watch more than one part of its surroundings. When an insect comes within reach, the chameleon catches it with a long, sticky tongue. These actions serve different purposes, so it would be a mistake to assume that every unusual feature is used only for hiding from other animals."],
  ["Parrots are", "Some parrots can copy human words, although repeating a sound does not always mean using it in the same way a person would. Their ability to copy makes them familiar to many people, but their strong, curved beaks are just as useful in daily life. The beak can crack open hard nuts that would otherwise be difficult to eat. Some parrots can also live for more than eighty years, much longer than many people expect. Anyone learning about these birds should therefore consider their feeding habits and long lives as well as the sounds that make them entertaining to hear."],
  ["In autumn, squirrels", "In autumn, squirrels may hide nuts in the ground so that food will be available during winter. They return to many of these stores, but some nuts are never collected. If conditions are suitable, a forgotten nut can begin growing into a new tree when warmer weather arrives. The squirrel does not need to plan this result for it to happen. An action that helps one animal prepare for a difficult season can also affect the surrounding woodland. This connection is easy to overlook because the new tree may appear long after the squirrel has moved away from the spot."],
  ["Blue whales are", "Although blue whales spend their lives in the sea, they breathe air rather than taking oxygen from water in the way fish do. They must return to the surface to breathe, even though they can remain underwater while feeding or traveling. Sound is another important part of their ocean environment. Under suitable conditions, their low calls can travel hundreds of kilometers through the water. A whale that is too far away to be seen may therefore still be heard. These details remind us that an animal's surroundings do not tell us everything about how its body works or how it communicates."],
  ["Fireflies make", "On a summer night, a field of flashing fireflies can look like blinking stars close to the ground. The lights are more than an attractive display: many fireflies use them to communicate with one another. Different kinds may produce different flash patterns, which help them recognize suitable partners. A person watching from a distance may notice only that the lights turn on and off, while careful observation reveals differences in their timing. Understanding the purpose of the flashes changes the scene from a collection of random lights into a set of signals being exchanged among living animals."]
];

for (const q of bank.filter(q => q.track === "adventure")) {
  const p = q.passage;
  if (passageChanges.has(p)) continue;
  const animal = animalTexts.find(([start]) => p.startsWith(start));
  const how = p.match(/^How to make (?:a )?([^:]+):/);
  const rewritten = animal ? animal[1] : how ? howto[how[1]] : rewriteBasic(p);
  if (rewritten) passageChanges.set(p, rewritten);
}

// Longer existing units already offer connected prose. Simplify dense passages selectively.
setPassage("adv_0501", "For hundreds of years, sailors described sea monsters with long arms that could pull ships underwater. Most readers thought these accounts were invented, but giant squid are real animals that live deep in the ocean. Some are longer than a small bus when their long feeding tentacles are included. Because their home is dark and difficult to reach, scientists rarely observe them alive. Much of what researchers first learned came from dead animals or remains found inside other sea creatures. Modern cameras have provided a better view, showing why a real animal can inspire stories that become larger and stranger with each telling.");
setPassage("adv_0507", "Notice to residents: Starting next month, our town will collect food waste separately from other trash. The scraps will be used to make compost, material that can be added to soil to help plants grow. Each home will receive a free green bin for this purpose. Please keep plastic bags and metal out of the bin because they do not belong in the composting process and would spoil the mixture. Workers will collect the food waste every Tuesday and Friday. Separating it carefully at home will make the new system easier to use and reduce the amount sent away as ordinary trash.");
setPassage("adv_0537", "Honey can remain in good condition for a very long time when it is stored properly. One reason is that it contains little water and a high amount of sugar, conditions that make it difficult for many bacteria to grow. Bees also add substances that help protect the honey as they process flower nectar. However, storage still matters: the container should be sealed and kept dry. If extra moisture enters, the conditions can change and the honey may spoil. Its long life therefore depends on both its natural properties and the way people care for it after it has been collected.");
setPassage("adv_0552", "Each autumn, monarch butterflies from eastern North America travel south toward wintering areas in Mexico. The journey is remarkable because the migration cycle continues across several generations. Butterflies that survive the winter begin moving north in spring, and later generations continue spreading northward. The butterflies that travel south the following autumn have not personally visited the wintering forests before. Their ancestors, or earlier generations, made a similar journey. Scientists study how these insects find their way over such long distances. The migration shows how a repeated pattern can connect many short lives into a much longer cycle.");
setPassage("adv_0567", "Some female anglerfish live deep in the ocean, where sunlight does not reach. A thin structure on the head holds a glowing lure, which acts like a small fishing light. Fish attracted to it may swim close enough for the anglerfish to catch them. The light comes from bacteria living inside the lure rather than from the fish's own cells. These bacteria receive a protected place to live, while their glow helps the anglerfish obtain food. Although the two living things are very different in size, both benefit from the relationship. This partnership is useful in a place where finding a meal can be difficult.");
setPassage("adv_0576", "People sometimes yawn soon after seeing another person do the same thing. Scientists still do not fully agree about why yawning happens or why it can spread between people. One idea is that yawning helps control brain temperature, while another connects it with staying alert. Some studies have also found that contagious yawning occurs more often among friends and family than among strangers. However, that pattern does not prove exactly what causes it. Researchers need to compare different explanations carefully. An everyday action that seems simple can therefore raise questions that are surprisingly difficult to answer.");
setPassage("adv_0582", "Field Trip Report by Class 5-2: On Tuesday, we visited Cheongun Pond to study its ecosystem, the living things in an area and their connections with the environment. We recorded twelve kinds of life, including insects on the surface and tadpoles under the leaves. Our guide explained that plants provide oxygen and shelter, while different animals use the pond for food. A change in one part can affect the others. That is why visitors should never release pet turtles into the water. A new animal may compete with the creatures already there, changing the balance that allows the pond community to survive.");
setPassage("adv_0585", "Interviewer: After twenty years as a firefighter, what do you find most difficult about the job?\nCaptain Ryu: Staying ready while we wait. A quiet evening can become an emergency in seconds, so we must remain calm and alert.\nInterviewer: How do you prepare for such a sudden change?\nCaptain Ryu: We practice the same movements repeatedly until they become familiar. That way, we can follow the correct steps even when an alarm surprises us.\nInterviewer: So training matters even after years of experience?\nCaptain Ryu: Certainly. In an emergency, you fall back on your training; you rely on the actions you have practiced.");

for (const q of bank.filter(q => q.track === "adventure")) {
  const replacement = passageChanges.get(q.passage);
  if (replacement) { q.passage = replacement; note(q, "지문 어휘·구문·문맥 조정"); }
}

// Corrections where the original evidence, claims, or distractors changed.
revise("adv_0001", "Where did Mina and Jun discover the map?", "In their grandmother's attic", ["Beside a tree on the island", "Inside Mina's backpack", "On a shelf in the town library"], "할머니의 다락방을 정리하던 중 잡지 더미 아래에서 발견했다. 배낭은 발견 후 지도를 넣은 곳이다.", ["reading", "detail"], 2);
revise("adv_0002", "What does Mina's decision to keep the map suggest?", "She wanted to learn more before making a plan", ["She was certain that treasure was buried there", "She had already arranged a trip to the island", "She wanted to hide the map from her brother"], "미나는 지도를 배낭에 넣고, 섬에 갈 계획을 세우기 전에 누가 왜 그렸는지 할머니에게 물으려 한다. 성급히 결론 내리지 않고 확인하려는 태도이다.", ["reading", "inference"]);
revise("adv_0008", "Which payment method is NOT accepted at the museum gift shop?", "Credit cards", ["Cash in small bills", "Cash in coins", "Cash in larger bills"], "기념품점은 현금만 받으며 신용카드는 사용할 수 없다고 명시한다. 다른 세 보기는 모두 현금이다.", ["notice", "detail"], 2);
revise("adv_0064", "What does the passage suggest about observing giraffes?", "Several observations reveal more than a brief visit", ["A photograph shows every part of their behavior", "Their feeding habits can be understood from height alone", "They remain on their feet whenever they rest"], "짧은 방문은 행동의 일부만 보여 주고 반복 관찰은 먹이 섭취·이동·휴식의 더 완전한 모습을 보여 준다고 설명한다.", ["nonfiction", "inference"]);
for (const q of bank.filter(q => q.track === "adventure")) {
  const old = before.find(x => x.id === q.id);
  if (old.passage.startsWith("Penguins are") && q.stem.includes("care for their egg")) revise(q.id, "How does the male emperor penguin protect the egg?", "He holds it on his feet beneath a fold of skin", ["He places it in a nest of branches", "He carries it into the sea to feed", "He leaves it on the ice while hunting"], "수컷은 알을 발 위에 올리고 피부 주름으로 덮어 차가운 얼음에 닿지 않게 한다.", ["nonfiction", "detail"], 2);
  if (old.passage.startsWith("Kangaroos carry") && q.stem.includes("NOT do")) revise(q.id, "What is the main purpose of the mother's pouch?", "To protect the joey while it continues growing", ["To store food that the adult will eat later", "To help the mother jump over taller plants", "To carry nesting materials to a safe place"], "아직 덜 발달한 새끼가 어미의 주머니에서 계속 성장한다. 주머니는 새끼를 보호하는 공간이다.", ["nonfiction", "purpose"]);
  if (old.passage.startsWith("Ants are") && q.stem === "How strong is an ant?") revise(q.id, "How does an ant's strength help the colony?", "It allows workers to move loads larger than their own weight", ["It removes the need for signals between workers", "It allows every ant to carry an adult person", "It makes the chemical trail visible to people"], "일부 개미는 몸무게의 여러 배가 되는 짐을 운반할 수 있어 군체가 먹이를 모으는 데 도움이 된다.", ["nonfiction", "detail"], 2);
  if (old.passage.startsWith("Sea turtles travel") && q.stem.startsWith("Where do")) revise(q.id, "Where do many female sea turtles return to lay their eggs?", "To the coastal region where they hatched", ["To the deepest part of the ocean", "To any river with warmer water", "To a different continent on every journey"], "많은 암컷 바다거북은 자신이 부화한 지역으로 돌아가 해변 모래에 알을 낳는다.", ["nonfiction", "detail"], 2);
}
revise("adv_0501", "What is the passage mainly explaining?", "How real giant squid may have inspired exaggerated stories", ["Why sailors stopped exploring deep water", "How scientists train squid to approach cameras", "Why every story about sea monsters is accurate"], "실제 대왕오징어와 과장된 바다 괴물 이야기를 연결하고, 관찰의 어려움과 카메라 연구를 설명한다.", ["nonfiction", "main-idea"]);
revise("adv_0502", "Why is it difficult to observe living giant squid?", "They live in deep water that is hard to reach", ["They appear only near busy harbors", "They always hide inside larger animals", "They are too small for cameras to record"], "서식지가 깊고 어두워 접근하기 어렵기 때문에 살아 있는 모습을 관찰하기 어렵다.", ["nonfiction", "detail"], 2);
revise("adv_0503", "What has helped researchers get a better view of giant squid?", "Modern cameras", ["Drawings made by early sailors", "Experiments in school swimming pools", "Maps of shallow coastal beaches"], "마지막 부분에서 현대의 카메라가 더 나은 관찰을 가능하게 했다고 설명한다.", ["nonfiction", "detail"], 2);
revise("adv_0509", "What is compost used for, according to the notice?", "It is added to soil to help plants grow", ["It keeps plastic bags from breaking", "It is mixed with metal before collection", "It replaces the green bins at each home"], "음식물 쓰레기로 만든 퇴비는 식물이 잘 자라도록 흙에 더하는 재료라고 설명한다.", ["notice", "vocabulary"]);
revise("adv_0537", "What is the main idea of the passage?", "Honey's properties and proper storage help it last a long time", ["Honey stays fresh under every possible condition", "Bees add water to prevent honey from changing", "Any sweet food can be stored in an open container"], "적은 수분과 많은 당분 등 꿀의 특성뿐 아니라 밀봉하고 건조하게 보관하는 조건도 중요하다.", ["nonfiction", "main-idea"]);
revise("adv_0538", "Which conditions make it difficult for many bacteria to grow in honey?", "Little water and a high amount of sugar", ["Plenty of water and an open container", "A low amount of sugar and extra moisture", "Frequent mixing with ordinary soil"], "두 번째 문장에서 수분이 적고 당분이 많은 환경이 많은 세균의 증식을 어렵게 한다고 설명한다.", ["nonfiction", "detail"], 2);
revise("adv_0539", "Why should a container of honey be kept sealed and dry?", "Extra moisture can change conditions and allow it to spoil", ["Air always removes all the sugar immediately", "A sealed container adds protective substances", "Dry storage prevents bees from making nectar"], "추가 수분이 들어오면 꿀의 조건이 달라져 상할 수 있으므로 밀봉하고 건조하게 보관한다.", ["nonfiction", "cause-effect"]);
revise("adv_0552", "What makes the monarch migration cycle remarkable?", "The journey continues across several generations", ["Every butterfly completes the entire cycle alone", "All butterflies remain in Mexico throughout the year", "Young butterflies follow written routes left by adults"], "전체 이동 주기는 한 개체가 아니라 여러 세대에 걸쳐 이어진다고 설명한다.", ["nonfiction", "main-idea"]);
revise("adv_0553", "What is true of butterflies traveling south in autumn?", "They have not personally visited the wintering forests before", ["They built the wintering forests during spring", "They have already completed several round trips", "They stay in the northern region all winter"], "가을에 남쪽으로 가는 세대는 월동 숲에 직접 가 본 적이 없다고 명시한다.", ["nonfiction", "detail"], 2);
revise("adv_0566", "Why did the science project improve at the end?", "The students used the strongest part of each other's work", ["They removed all the drawings from the poster", "They agreed to submit two separate projects", "They waited for the teacher to choose every detail"], "지우의 그림과 민서의 제목을 함께 사용하면서 서로의 장점을 살린 결과물이 되었다.", ["story", "cause-effect"]);
revise("adv_0572", "What does Dana teaching her cousin suggest?", "The family is passing its cooking tradition to younger members", ["The written recipe will replace family gatherings", "Dana has decided to stop learning from her relatives", "The cousin will prepare every meal alone from now on"], "다나는 이모에게 배운 만두 접기를 어린 사촌에게 가르친다. 가족의 전통이 다음 세대로 이어지는 장면이다.", ["story", "inference"]);
revise("adv_0584", "What does the word \"ecosystem\" refer to in the report?", "Living things and their connections with the environment", ["A list containing only the names of fish", "Equipment used to measure the depth of a pond", "A place where people keep pet turtles indoors"], "ecosystem 뒤에 생물과 환경 사이의 연결 관계라는 뜻풀이가 제시되어 있다.", ["nonfiction", "vocabulary"]);

// Replace unrelated distractors with steps from the same procedure.
for (const q of bank.filter(q => q.tags.includes("how-to"))) {
  const old = before.find(x => x.id === q.id);
  const topic = old.passage.match(/^How to make (?:a )?([^:]+):/)[1];
  const steps = {
    bookmark: ["Cut a strip of thick paper", "Draw an animal on the paper", "Tape a ribbon to the top", "Press the tape firmly"],
    lemonade: ["Squeeze three lemons into a jug", "Add cold water and sugar", "Check the flavor of the mixture", "Add ice before serving"],
    "jam sandwich": ["Spread jam on a slice of bread", "Add banana slices in one layer", "Put another slice of bread on top", "Wrap the completed sandwich"],
    "seed pot": ["Fill a paper cup with soil", "Push the seed into the soil", "Check whether the soil feels dry", "Record changes in the plant"],
    "sock puppet": ["Put a clean sock on your hand", "Glue two button eyes onto the sock", "Draw a mouth with a marker", "Let the glue dry"],
    "fruit salad": ["Wash the fruit well", "Cut the fruit into small pieces", "Mix the fruit with yogurt", "Keep the finished salad cool"],
    "paper airplane": ["Fold a sheet of paper in half the long way", "Fold the top corners toward the middle", "Fold the wings down on both sides", "Test the plane in a clear space"],
    "paper boat": ["Fold a square piece of paper in half", "Fold the corners toward the middle", "Open the bottom of the model", "Press the bottom flat"]
  }[topic];
  if (q.tags.includes("sequence")) {
    revise(q.id, `According to the instructions, what is the first step in making ${/^(lemonade|fruit salad)$/.test(topic) ? "" : "a "}${topic}?`, steps[0], steps.slice(1), `준비가 된 상태에서 제시한 첫 단계는 '${steps[0]}'이다. 나머지 보기는 같은 과정의 뒤 단계이므로 순서를 구분해야 한다.`, ["how-to", "sequence"], 2);
  } else {
    const why = {
      bookmark: ["Why is a ribbon attached to the bookmark?", "To help the reader find the marked page", ["To make the pages fold more easily", "To hide the animal drawn on the paper", "To replace the thick paper completely"], "리본이 책 밖으로 나와 있어 페이지를 접거나 손상하지 않고 읽던 곳을 찾을 수 있다."],
      "jam sandwich": ["Why should the banana slices form a single layer?", "To keep the filling even and easier to hold together", ["To make the bread absorb more water", "To stop the jam from tasting sweet", "To remove the need for the top slice"], "바나나를 한 겹으로 고르게 놓아야 속이 균일하고, 너무 많아 흘러나오는 것을 피할 수 있다."],
      "seed pot": ["Why has the teacher made holes in the paper cups?", "To let extra water drain away", ["To let the seed fall onto the desk", "To keep all water inside the cup", "To prevent the students from labeling it"], "여분의 물이 빠져나가야 하므로 배수 구멍을 미리 만들었다."],
      "sock puppet": ["Why should the puppet have a clear face?", "So the audience can recognize its expression", ["So the glue will never need to dry", "So it can stand without a person's hand", "So buttons are no longer needed"], "관객이 꼭두각시의 표정을 알아볼 수 있어야 하므로 추가 장식보다 분명한 얼굴이 중요하다."]
    }[topic];
    revise(q.id, ...why.slice(0, 4), ["how-to", "purpose"]);
  }
}

// LFM: sentence-level grammar is not assigned a Lexile score. Replace outlying
// constructions with contextual questions and remove dialect-dependent answers.
const grammar = [];
function g(id, stem, correct, wrong, explanation, tags, difficulty = 3) { grammar.push([id, stem, correct, wrong, explanation, tags, difficulty]); }
g("lfm_0004", "We compared three comedy films for the school review. This one was the ___ of the three.", "funniest", ["funny", "funnier", "funnily"], "세 편 중 가장 웃긴 영화를 고르는 최상급 자리이므로 funniest이다. funnier는 비교급, funnily는 부사이다.", ["comparative", "superlative"]);
const conditionals = [
  ["0501", "The outdoor lesson depends on the weather. If it ___ tomorrow, we will move the lesson inside.", "rains", ["rained", "will rain", "raining"]],
  ["0502", "The class needs your reply before Friday. If you ___ early, the teacher will reserve your seat.", "respond", ["responded", "will respond", "responding"]],
  ["0503", "Mina is saving for a train ticket. If she ___ enough money, she will visit her cousin next month.", "saves", ["saved", "will save", "saving"]],
  ["0504", "The library closes soon. If we ___ now, we will have time to return the books.", "leave", ["left", "will leave", "leaving"]],
  ["0505", "The teacher has promised to explain the diagram again. If anyone ___ a question, she will answer it.", "has", ["have", "will have", "having"]],
  ["0506", "The garden needs regular care. If each group ___ one job, the work will be easier.", "takes", ["take", "will take", "taking"]],
  ["0507", "Our team still needs a meeting place. If the room ___ available, we will use it after lunch.", "is", ["are", "will be", "being"]],
  ["0508", "The visitors arrive at noon. If they ___ the early bus, they will reach us in time.", "catch", ["caught", "will catch", "catching"]],
  ["0509", "We can share the instructions on paper. If you ___ a printer, I will bring you a copy.", "do not have", ["does not have", "will not have", "not having"]]
];
for (const [id, stem, c, ds] of conditionals) g("lfm_" + id, stem, c, ds, `미래의 조건을 나타내는 if절에서는 현재형을 쓴다. 주어와 수를 맞춘 '${c}'가 알맞고, 결과는 주절의 will로 표현한다.`, ["conditional", "tense"]);
const past = [
  ["0510", "The doors were already closed when we reached the station. The train ___ five minutes earlier.", "had left", ["has left", "will leave", "is leaving"]],
  ["0511", "When the teacher asked for our report, it was ready. We ___ it the evening before.", "had completed", ["have completed", "will complete", "are completing"]],
  ["0512", "I recognized the story during yesterday's lesson because I ___ it before that class.", "had read", ["have read", "will read", "am reading"]],
  ["0513", "At yesterday's meeting, Sara showed us the model she ___ during the previous week.", "had built", ["has built", "will build", "is building"]],
  ["0514", "The ground was wet when we arrived, although the sky was clear. It ___ before we got there.", "had rained", ["has rained", "will rain", "is raining"]]
];
for (const [id, stem, c, ds] of past) g("lfm_" + id, stem, c, ds, `과거 기준 시점보다 먼저 끝난 일을 설명하므로 과거완료 '${c}'를 쓴다. 나머지는 현재·미래를 기준으로 한 형태이다.`, ["tense", "past-perfect"]);
g("lfm_0515", "The notice was posted this morning. Students ___ bring a signed form to join the trip; it is required.", "must", ["might", "would", "could"], "참가에 필수라고 했으므로 의무를 나타내는 must가 알맞다.", ["modal", "obligation"]);
g("lfm_0516", "The group has only ten minutes left. We need ___ our discussion and choose a title.", "to finish", ["finishing", "finished", "finish"], "need 뒤에서 하려는 행동을 나타내는 to부정사 to finish가 필요하다.", ["infinitive", "verb-pattern"], 2);
g("lfm_0517", "The instructions are unclear to me. Could you explain ___ the two pieces fit together?", "how", ["which", "whose", "what"], "두 조각이 어떻게 맞물리는지 방법을 묻는 how가 알맞다. 뒤에는 주어와 동사가 이어진다.", ["indirect-question", "word-order"]);
g("lfm_0518", "Our first attempt failed, but we learned from it. This time, we checked the measurements more ___ before cutting.", "carefully", ["careful", "carefulness", "care"], "동사 checked를 수식하므로 부사 carefully를 쓴다. more carefully는 더 주의 깊게라는 뜻이다.", ["adverb", "word-form"]);
g("lfm_0519", "The cake was divided among the visitors. There isn't ___ left for the students arriving later.", "much", ["many", "a few", "few"], "여기서 cake는 남은 케이크의 양을 나타내는 불가산 용법이므로 much가 알맞다.", ["quantifier", "uncountable"]);
g("lfm_0520", "The class is choosing books for a reading project. Our teacher suggested ___ short reviews before deciding.", "reading", ["read", "to read", "reads"], "suggest 뒤에 행동을 목적어로 쓸 때 동명사 reading을 쓴다.", ["gerund", "verb-pattern"]);
g("lfm_0521", "The new path can be slippery after rain. Visitors are advised ___ on the marked walkway.", "to stay", ["stay", "staying", "stayed"], "be advised to + 동사원형은 ~하도록 권고받는다는 뜻이다.", ["infinitive", "verb-pattern"]);
g("lfm_0522", "The workshop begins at nine. Everyone in the two groups ___ expected to arrive ten minutes early.", "is", ["are", "be", "have"], "주어 everyone은 단수이다. 뒤의 in the two groups가 복수여도 동사는 is를 쓴다.", ["subject-verb-agreement"]);
g("lfm_0523", "The coach explained why the equipment must be dry. Each player needs ___ the locker after practice.", "to clean", ["clean", "cleaning", "cleans"], "needs 뒤에 해야 할 행동을 나타내는 to clean이 필요하다.", ["infinitive", "verb-pattern"], 2);
g("lfm_0524", "Mina had worked for an hour without stopping. Her teacher advised her ___ a short break.", "to take", ["take", "taking", "took"], "advise + 목적어 + to부정사 구문이다. her 뒤에 to take를 쓴다.", ["infinitive", "verb-pattern"]);
// Past-tense reports explicitly anchor the action in the completed past.
g("lfm_0525", "She told us about last Saturday's hike. She ___ very tired when she reached home that evening.", "was", ["is", "will be", "has been"], "지난 토요일 저녁의 끝난 상태를 설명하므로 과거형 was이다.", ["tense"], 2);
g("lfm_0526", "Yesterday, Joon promised to bring his drawing today. He said that he ___ show it to us at lunch.", "would", ["would have", "is", "has"], "과거에 한 약속에서 그 이후의 행동을 나타내므로 would + 동사원형을 쓴다.", ["reported-speech", "tense"]);
g("lfm_0527", "When I invited Tom to lunch yesterday, he was no longer hungry. He ___ already finished his meal.", "had", ["has", "having", "will have"], "어제 초대한 시점보다 먼저 식사를 마쳤으므로 had already finished이다.", ["tense", "past-perfect"]);
g("lfm_0528", "She learned to swim when she was six. By her seventh birthday, she ___ swim across the small pool.", "could", ["can", "will", "could have"], "과거 시점의 능력은 could + 동사원형이다. could have 뒤에는 과거분사가 필요하다.", ["modal", "tense"]);
g("lfm_0529", "Before moving to Seoul in 2022, my uncle ___ in Busan for ten years.", "had lived", ["has lived", "will live", "is living"], "2022년에 이사한 과거 시점보다 앞서 이어진 거주 기간을 말하므로 had lived이다.", ["tense", "past-perfect"]);
g("lfm_0540", "She had spent the afternoon preparing the display. Because she ___ tired, she went to bed early.", "felt", ["feel", "feeling", "to feel"], "접속사 because 뒤에는 주어와 동사가 필요하다. 과거 이야기이므로 동사는 felt이다.", ["tense", "conjunction"]);
g("lfm_0548", "The sunset was beautiful, so I took a photograph. I have never ___ colors like those before.", "seen", ["see", "saw", "seeing"], "현재완료 have + 과거분사에 맞는 seen이다. 부정어 도치 없이 기본 어순을 확인한다.", ["present-perfect", "tense"]);
g("lfm_0549", "We hurried toward the building as the clouds grew darker. Soon after we ___, it started to rain.", "arrived", ["arrive", "arriving", "will arrive"], "과거의 두 사건을 순서대로 설명하므로 arrived이다.", ["tense", "conjunction"], 2);
g("lfm_0550", "The runner surprised the whole team yesterday. He won the race and also ___ the school record.", "broke", ["break", "breaks", "breaking"], "과거 동사 won과 and로 연결되므로 과거형 broke를 쓴다.", ["tense"], 2);
g("lfm_0551", "The diagram looked confusing at first. After the teacher explained it, I ___ able to describe the process.", "was", ["am", "were", "be"], "과거의 변화이고 주어가 I이므로 was able to가 알맞다.", ["tense", "subject-verb-agreement"], 2);
g("lfm_0552", "The class had worked together for weeks. Everyone ___ pleased when the final display was ready.", "was", ["were", "be", "are"], "everyone은 단수 취급하며, 과거의 완성 시점에 대한 설명이므로 was이다.", ["subject-verb-agreement", "tense"]);
g("lfm_0553", "My grandparents showed me an old photograph. It was the house ___ stood beside their first school.", "which", ["who", "whose", "whom"], "선행사는 사물 house이고 관계절의 주어 역할을 하므로 which가 필요하다.", ["relative-clause"]);
g("lfm_0554", "I traveled with a friend during the holiday. She is a doctor ___ works at a children's hospital.", "who", ["which", "whose", "whom"], "사람을 나타내는 doctor 뒤에서 주어 역할을 하는 관계대명사 who를 쓴다.", ["relative-clause"]);
g("lfm_0558", "We checked the classroom after the alarm. The teacher and the students ___ already outside.", "were", ["was", "is", "has"], "and로 연결된 복수 주어이고 과거 상황이므로 were이다.", ["subject-verb-agreement", "tense"]);
g("lfm_0559", "The students have different jobs for the exhibition. Each student ___ responsible for one small part.", "is", ["are", "be", "have"], "each + 단수 명사를 주어로 쓰면 단수 동사 is가 필요하다.", ["subject-verb-agreement"]);
g("lfm_0560", "The players meet before school twice a week. Their coach ___ the practice plan every Monday.", "checks", ["check", "checking", "are checking"], "주어 coach는 단수이며 반복되는 일과를 현재시제로 표현하므로 checks이다.", ["subject-verb-agreement"]);
g("lfm_0579", "The first report lacked useful examples. For the next report, you ___ include evidence to support your ideas.", "should", ["should have", "ought", "must to"], "앞으로의 조언은 should + 동사원형이다. should have는 과거분사, ought는 to가 필요하다.", ["modal"]);
g("lfm_0580", "The forecast is uncertain. It ___ rain tonight, so the team has prepared an indoor plan.", "might", ["might have", "can to", "must to"], "불확실한 가능성을 나타내는 might 뒤에는 동사원형 rain이 온다.", ["modal"]);
g("lfm_0581", "The machine is still moving. You ___ open the cover now; the safety instructions forbid it.", "must not", ["do not have to", "may", "should"], "안전 지침에서 금지하므로 must not이다. do not have to는 필요가 없다는 뜻이다.", ["modal", "obligation"]);
g("lfm_0582", "I'm not sure where Joon is. He ___ be in the library, but I haven't checked there yet.", "might", ["might have", "has", "is"], "확실하지 않은 현재의 가능성이므로 might be이다. might have be는 잘못된 형태이다.", ["modal"]);
g("lfm_0601", "Several students helped with the repair. Mina was the student ___ found the missing piece.", "who", ["which", "whose", "whom"], "선행사 student를 설명하는 관계절에서 주어가 필요하므로 who이다.", ["relative-clause"]);
g("lfm_0602", "Our school opened in 2010. A new library ___ beside it five years later.", "was built", ["built", "is building", "builds"], "도서관은 지어진 대상이고 과거 시점이므로 was built를 쓴다.", ["passive", "tense"]);
g("lfm_0603", "Of all my school subjects, I find English the most ___. I especially enjoy comparing stories.", "interesting", ["interest", "interested", "interestingly"], "영어라는 과목이 흥미를 일으키므로 interesting이다. 사람의 감정을 나타내는 interested와 구별한다.", ["participle", "word-form"]);
g("lfm_0604", "I checked the office before searching the library. My wallet ___ under a library chair a few minutes later.", "was found", ["found", "was finding", "finds"], "지갑은 발견된 대상이고 과거 상황이므로 was found라는 수동태를 쓴다.", ["passive", "tense"]);
g("lfm_0615", "We measured two model towers in class. The red one was ___ than the blue one.", "higher", ["high", "highest", "highly"], "두 대상을 than으로 비교하므로 비교급 higher이다.", ["comparative"], 2);
g("lfm_0616", "The first box holds twelve books, while the second holds twenty. The second box has a ___ capacity.", "larger", ["largest", "largely", "large than"], "두 상자의 수용량을 비교하고 명사 capacity를 꾸미므로 larger가 알맞다.", ["comparative"]);
g("lfm_0617", "Our model bridge is sixty centimeters long. The other is twenty, so ours is three times as ___ as the other.", "long", ["longer", "longest", "length"], "배수 + as + 형용사 원급 + as 구조이다. 60은 20의 세 배이므로 as long as를 쓴다.", ["as-as", "comparative"]);
g("lfm_0618", "We tested two bags with the same load. The new bag felt ___ than the old one.", "lighter", ["light", "lightest", "lightly"], "than을 이용해 두 가방을 비교하므로 lighter이다.", ["comparative"], 2);
g("lfm_0626", "Workers completed the new library last month. It ___ near the park so students could reach it easily.", "was built", ["built", "is building", "builds"], "지난달에 지어진 도서관이므로 과거 수동태 was built이다.", ["passive", "tense"]);
g("lfm_0628", "The children's parents were away for the afternoon. Their grandmother agreed ___ care of them until dinner.", "to take", ["take", "taking", "took"], "agree는 뒤에 to부정사를 취하므로 to take이다. take care of는 돌보다라는 뜻이다.", ["infinitive", "verb-pattern"]);
g("lfm_0629", "The school choir performs this song every spring. It ___ by a former student many years ago.", "was written", ["wrote", "is writing", "writes"], "노래가 과거에 쓰인 대상이므로 was written이다.", ["passive", "tense"]);
g("lfm_0634", "We cannot change yesterday's result. Instead of ___ about it all day, let's plan our next attempt.", "worrying", ["worry", "to worry", "worried"], "전치사 of 뒤에는 동명사 worrying이 와야 한다.", ["gerund", "preposition"]);
g("lfm_0641", "The students waited quietly for the results. When they ___ the news, they cheered together.", "heard", ["hear", "hearing", "to hear"], "when절 안에 과거 동사가 필요하므로 heard이다. 주절 cheered와 시점이 일치한다.", ["tense", "conjunction"]);
for (const row of grammar) revise(...row);

// Additional review of legacy item families: natural subjects, one correct option,
// and genuinely different items instead of underscore-only duplicates.
revise("lfm_0225", "The museum displayed an old invitation. It ___ by a local artist before the first exhibition opened.", "was designed", ["designed", "is designing", "designs"], "초대장은 디자인된 대상이고 과거의 일이다. was designed라는 과거 수동태가 필요하다.", ["passive", "tense"]);
revise("lfm_0271", "We need a quiet space for the interview. If the office ___ empty tomorrow, we will record it there.", "is", ["was", "will be", "being"], "미래의 조건을 나타내는 if절은 현재형을 쓰므로 단수 주어 office에 맞는 is이다.", ["conditional", "tense"]);
revise("lfm_0486", "The new exhibit includes a model that visitors can touch. The guide asked us ___ our hands before using it.", "to wash", ["wash", "washing", "washed"], "ask + 목적어 + to부정사 구문이므로 asked us to wash이다.", ["infinitive", "verb-pattern"]);
revise("lfm_0487", "The climbing instructor checked everyone's equipment. Participants ___ follow the marked route; leaving it is forbidden.", "must", ["might", "could", "would"], "표시된 경로를 벗어나는 것이 금지되어 있으므로 경로를 따라야 한다는 의무의 must이다.", ["modal", "obligation"]);
revise("lfm_0100", "The forecast says rain is possible, but not certain. It ___ rain this afternoon, so take an umbrella.", "might", ["might have", "may to", "is"], "현재의 불확실한 가능성을 나타내는 might 뒤에 동사원형 rain을 쓴다.", ["modal"]);
revise("lfm_0320", "Somin read about this topic yesterday, but I don't know how much she remembers. She ___ know the answer.", "might", ["might have", "is", "does to"], "알고 있을 가능성만 말하므로 might know이다. 다른 보기는 뒤의 동사원형 know와 연결되지 않는다.", ["modal"]);
revise("lfm_0441", "Snow is possible tonight, although the forecast may change. It ___ snow while we are traveling.", "might", ["might have", "is", "may to"], "불확실한 가능성은 might + 동사원형으로 표현한다.", ["modal"]);
revise("lfm_0479", "The class watched several comedy films for a project. Everyone voted this one the ___ film in the group.", "funniest", ["funny", "funnier", "funnily"], "여러 영화 가운데 가장 웃긴 것을 고르므로 최상급 funniest이다.", ["superlative"]);
revise("lfm_0241", "Dad was preparing dinner at the same time that I was setting the table. Dad cooked ___ I set the table.", "while", ["because of", "during", "despite"], "동시에 일어난 두 행동을 연결하는 while 뒤에는 주어와 동사가 있는 절이 온다. 다른 보기는 전치사라 이 절을 바로 이끌 수 없다.", ["conjunction"]);
revise("lfm_0130", "The latest report has just arrived. The news about the contest ___ very surprising to us right now.", "is", ["are", "be", "been"], "news는 단수 취급하며 지금의 반응이므로 is가 알맞다.", ["subject-verb-agreement"]);
revise("lfm_0184", "Visitors often ask about places to study. There ___ a large public library near our school now.", "is", ["are", "be", "been"], "실제 주어가 단수인 a large public library이므로 is이다.", ["subject-verb-agreement"]);
revise("lfm_0384", "The bus has just arrived. Everyone in my class ___ excited about the field trip right now.", "is", ["are", "be", "been"], "everyone은 단수 취급하고 현재 상황이므로 is이다.", ["subject-verb-agreement"]);
revise("lfm_0420", "We have several subjects this term, but math ___ my favorite subject right now.", "is", ["are", "be", "been"], "과목 이름 math는 단수 취급한다. 현재의 선호를 설명하므로 is이다.", ["subject-verb-agreement"]);
revise("lfm_0598", "Your solution uses fewer steps than mine. Can you show me ___ you solved the puzzle, step by step?", "how", ["which", "what", "whose"], "풀이 방법을 단계별로 설명해 달라는 요청이므로 방법을 나타내는 how이다.", ["indirect-question", "word-order"]);
revise("lfm_0619", "Please call immediately after reaching home. Call me ___ you get there, without waiting.", "as soon as", ["during", "because of", "despite"], "도착하자마자라는 뜻의 as soon as가 절 you get there를 이끈다. 나머지는 전치사라 바로 절을 이끌 수 없다.", ["conjunction"]);
revise("lfm_0621", "He had to save for months to afford the game. ___ it was expensive, he finally bought it.", "Even though", ["Despite", "Because of", "During"], "비쌌지만 샀다는 양보 관계이며 뒤에 절이 오므로 Even though이다. Despite 등 전치사 뒤에는 이 절을 그대로 쓸 수 없다.", ["conjunction"]);
revise("lfm_0571", "The driving course is only for adults. He is ___ young to join because he is only twelve.", "too", ["such", "enough", "many"], "too + 형용사 + to부정사는 너무 ~해서 …할 수 없다는 의미이다.", ["infinitive", "word-form"]);
revise("lfm_0573", "I tried to move the box, but it would not move. It is ___ heavy for me to lift without help.", "too", ["such", "enough", "many"], "도움 없이는 들 수 없을 만큼 무겁다는 의미로 too heavy to lift를 쓴다.", ["infinitive", "word-form"]);

// Normalize defective generated frames without adding irrelevant padding.
const goalContexts = {
  "join the soccer team": ["The school is accepting applications for its sports clubs", "when registration opens"],
  "be a singer": ["The music teacher is offering lessons to students who enjoy performing", "and prepare for the next school concert"],
  "make new friends": ["A student has recently moved to a school in another town", "by taking part in group activities"],
  "become a scientist": ["The science club has introduced several kinds of research to the class", "and learn how experiments are planned"],
  "ride a horse": ["The activity center offers lessons for beginners with a trained instructor", "during the school holiday"],
  "learn French": ["The class is arranging an exchange with students at a school in France", "before the exchange begins"],
  "win the contest": ["A local competition is open to students who have prepared a short project", "after completing the application form"],
  "buy a new bike": ["The old bicycle has become too small for its owner", "after saving enough money"],
  "visit Jeju Island": ["The geography class is studying islands and their landscapes", "during a future family holiday"],
  "see the ocean": ["The class has been reading about coastal towns and beaches", "during the summer break"],
  "get a puppy": ["The family has discussed the daily work involved in caring for a dog", "after preparing a suitable place at home"],
  "travel around the world": ["A travel book has introduced the reader to places in several countries", "after finishing school"]
};
for (const q of bank.filter(q => q.track === "lfm")) {
  const oldStem = q.stem;
  const goal = q.stem.match(/^(\w+) (.+?) ___ someday\.$/);
  if (goal && q.tags.includes("infinitive")) {
    const [, name, oldVerb] = goal;
    const action = q.choices[q.answer].replace(/^to /, "");
    const frame = goalContexts[action];
    assert(frame, q.id + " goal context");
    const concrete = { "be a singer": "take singing lessons", "become a scientist": "study science", "win the contest": "enter the contest" }[action];
    if (concrete) {
      const base = concrete, ing = concrete.replace(/^take/, "taking").replace(/^study/, "studying").replace(/^enter/, "entering");
      const third = concrete.replace(/^take/, "takes").replace(/^study/, "studies").replace(/^enter/, "enters");
      const choices = [base, ing, third];
      choices.splice(q.answer, 0, "to " + concrete);
      q.choices = choices;
    }
    const verb = { needs: "is hoping", agreed: "has decided", chose: "has chosen" }[oldVerb] || oldVerb;
    q.stem = `${frame[0]}. ${name} ${verb} ___ ${frame[1]}.`;
    q.explanation = `'${verb}' 뒤에 계획·희망·결정의 내용을 나타내는 to부정사가 필요하므로 '${q.choices[q.answer]}'가 알맞다. 동명사나 동사원형을 그대로 쓰지 않는다.`;
  }
  q.stem = q.stem.replace(/^(\w+) is famous ___ its/, "$1's town is famous ___ its")
    .replace(/^(\w+) is full ___ old toys/, "$1's storage box is full ___ old toys")
    .replace(/^(\w+) is full ___ books/, "$1's bookshelf is full ___ books")
    .replace(/^(\w+) is full ___ colorful fish/, "$1's aquarium is full ___ colorful fish")
    .replace(/^(\w+) is different ___ (mine|yours)/, "$1's design is different ___ $2")
    .replace("I don't have ___ friends in my bag.", "I joined the club only yesterday, so I don't have ___ friends there yet.")
    .replace("I don't have ___ questions in my bag.", "The instructions are quite clear, so I don't have ___ questions about the project.")
    .replace("How ___ questions did you bring today?", "How ___ questions did you prepare for today's interview?")
    .replace("How ___ homework do we need for this?", "How ___ homework do we need to finish before the trip?")
    .replace("She has lived in Busan ___ ten minutes.", "She has waited at the Busan station ___ ten minutes.")
    .replace("She has lived in Busan ___ this morning.", "She has been at the Busan station ___ this morning.")
    .replace("If it ___ this weekend, school will start late.", "If it ___ on Monday morning, school will start late.");
  const possessives = { Zoe: "her", Daniel: "his", Jun: "his", Owen: "his", Hana: "her" };
  const subject = q.stem.split(" ")[0];
  if (possessives[subject] && q.tags.includes("collocation")) q.stem = q.stem.replace(/\b(his|her|their) (little sister|brother|baby brother|sick cat|school)\b/, `${possessives[subject]} $2`);
  const alternativeComparatives = { "more strong": "strongly", "more easy": "easily", "more hot": "heat", "more cheap": "cheaply", "more smart": "smartly", "more tall": "height", "more old": "age", "most old": "older than", "most fast": "quickly", "most tall": "height" };
  q.choices = q.choices.map((choice, i) => i !== q.answer && alternativeComparatives[choice] ? alternativeComparatives[choice] : choice);
  q.choices = q.choices.map(s => s === "tallly" ? "height" : s);
  if (q.stem.includes("already ___")) {
    q.stem = q.stem.replace("already ___", "___");
    q.explanation += " 과거완료 자체가 앞선 완료를 나타내며 already는 생략해도 된다.";
  }
  if (/There isn't ___ (homework|information|time|advice) left, so we need to get some more\./.test(q.stem)) {
    const noun = q.stem.match(/___ (\w+) left/)[1];
    const contexts = {
      homework: "We finished most of the assignments during study time. There isn't ___ homework left for tonight.",
      information: "We found only a short note about the old building. There isn't ___ information available for our report.",
      time: "The bus is due in five minutes. There isn't ___ time left to finish packing.",
      advice: "The guide gives several examples but little practical help. There isn't ___ advice about choosing materials."
    };
    q.stem = contexts[noun];
  }
  if (/^\w+ (needs|decides|hopes|plans|wants|promises|learns|agrees|refuses|expects) ___ someday\.$/.test(q.stem)) {
    const n = q.stem.split(" ")[0];
    const v = q.stem.split(" ")[1];
    q.stem = v === "needs" ? `${n} is considering the next step in a personal plan. ${n} needs ___ before moving on.`
      : v === "learns" ? `${n} is developing a new skill. With regular lessons, ${n} learns ___ step by step.`
      : v === "refuses" ? `The proposed plan does not appeal to ${n}. After thinking about it, ${n} refuses ___.`
      : `${n} is discussing a personal goal with a teacher. After considering the possibilities, ${n} ${v} ___.`;
  }
  if (/^Puppies always look/.test(q.stem)) q.stem = q.stem.replace("Puppies always look", "After playing with their new toys, the puppies look");
  // 'more happy' and 'more funny' can be acceptable: never use them as unequivocally wrong.
  if (q.choices.includes("more happy") && q.choices[q.answer] === "happier") q.choices[q.choices.indexOf("more happy")] = "happily";
  if (q.choices.includes("more funny") && q.choices[q.answer] === "funnier") q.choices[q.choices.indexOf("more funny")] = "funnily";
  if (q.stem !== oldStem) note(q, "문법 문맥·어순 오류 수정");
  if (!/[가-힣]/.test(q.explanation)) {
    q.explanation += ` 주어와 같은 사람을 가리키는 재귀대명사 '${q.choices[q.answer]}'를 쓴다. by oneself는 혼자 힘으로라는 뜻이다.`;
    note(q, "한국어 문법 해설 보완");
  }
}

// Explanations must describe the revised evidence, not quote removed sentences.
const revisedExplanations = {
  adv_0005: "어린잎이 사라지고 흙에서 토끼 발자국이 발견되었다. 토끼가 채소에 접근하지 못하도록 울타리를 세우려는 것이다.",
  adv_0014: "hive 바로 뒤에 벌의 군체가 사는 집이라는 뜻풀이가 나온다. 따라서 a bee's home이 알맞다.",
  adv_0017: "수영 수업은 수영장이 아닌 체육관에서 계속되며, 교사가 스트레칭 운동을 지도한다고 설명한다.",
  adv_0046: "하나는 등교 준비 중 점심 도시락이 없어진 것을 깨닫고 여러 곳을 찾았다. 찾던 물건은 lunch box이다.",
  adv_0051: "준은 도서관 책이 없어진 것을 깨닫고 집 안을 찾았다. 찾던 물건은 library book이다.",
  adv_0101: "잭은 집 열쇀이 없어진 것을 깨닫고 여러 곳을 찾았다. 찾던 물건은 house key이다.",
  adv_0124: "벤은 집 열쇠가 없어진 것을 깨닫고 여러 곳을 찾았다. 찾던 물건은 house key이다.",
  adv_0073: "지문은 체온이나 기분이 변할 때 색이 달라질 수 있으며, 추워지거나 화가 날 때를 예로 든다.",
  adv_0094: "돌고래는 clicks and whistles라는 소리 신호로 서로 연락한다고 설명한다.",
  adv_0105: "반딧불이의 빛은 단순한 장식이 아니라 의사소통 신호이다. 서로 신호를 주고받기 위해 빛을 낸다는 보기가 알맞다.",
  adv_0160: "낙타의 긴 속눈썹은 바람에 날리는 모래가 눈에 들어가는 것을 막는다.",
  adv_0174: "겨울에도 먹이를 구할 수 있도록 가을에 견과류를 묻어 둔다. 나무를 심는 것이 직접적인 목적은 아니다.",
  adv_0175: "문어가 주변 바위나 모래와 비슷하게 보이면 위험이 다가올 때 발견되기 어렵다. 색 변화는 적으로부터 숨는 데 도움이 된다.",
  adv_0212: "기린은 긴 혀로 나뭇잎을 감아 가지에서 떼어 낸다. 앞다리로 잡는 것이 아니다.",
  adv_0227: "날개 깃털의 특별한 구조가 비행 중 발생하는 소리를 줄이므로 조용히 접근할 수 있다.",
  adv_0231: "펭귄의 몸은 헤엄치기에 적합하여 수면 아래에서 먹이를 찾는다. 하늘을 날지는 못한다.",
  adv_0232: "일부 앵무새는 80년 넘게 살 수 있다고 설명한다. 모든 앵무새의 수명이 같다는 의미는 아니다.",
  adv_0256: "박쥐는 높은 소리를 낸 뒤 돌아오는 메아리를 듣고 곤충의 위치를 파악한다.",
  adv_0258: "낙타의 혹은 물이 아니라 지방을 저장한다. 먹지 못하고 이동할 때 사용할 비축 에너지원이다.",
  adv_0273: "흰긴수염고래는 물고기처럼 물에서 산소를 얻지 않고 공기를 마신다. 그래서 숨을 쉬려면 수면으로 돌아와야 한다.",
  adv_0288: "더운 날 큰 귀를 흔드는 행동은 코끼리가 체온을 낮추는 데 도움이 된다.",
  adv_0315: "코끼리는 작은 땅콩을 집거나 무거운 통나무를 움직이는 등 코를 손처럼 사용한다.",
  adv_0369: "알맞은 조건에서 낮은 소리가 물속으로 수백 킬로미터까지 전달될 수 있다고 설명한다.",
  adv_0389: "눈이 동시에 서로 다른 방향으로 움직여 주변의 여러 부분을 볼 수 있다는 점이 특징이다.",
  adv_0396: "겉으로 흰색처럼 보이지만 털 아래 피부는 검은색이라고 한다. 질문은 털이 아니라 피부색을 묻는다.",
  adv_0398: "화학 물질의 냄새로 남긴 길을 다른 개미가 따라 먹이를 찾을 수 있다. 먼저 간 일개미의 정보를 공유하는 방식이다.",
  adv_0410: "새끼 캥거루를 joey라고 부른다고 설명한다. 새끼는 어미의 주머니 안에서 계속 자란다.",
  adv_0411: "수거되지 않은 견과류 중 일부는 조건이 알맞으면 따뜻한 날씨에 싹터 새 나무가 될 수 있다.",
  adv_0463: "많은 박쥐는 낮에 보호받는 장소에서 거꾸로 매달려 쉰다고 설명한다.",
  adv_0476: "북극곰은 멀리 있는 물범의 냄새를 감지할 수 있다. 지문에 나온 먹이는 seal이다.",
  adv_0508: "플라스틱과 금속은 퇴비화 과정에 적합하지 않고 혼합물을 망치므로 초록색 통에 넣지 말라고 한다.",
  adv_0551: "양을 지키던 소년은 지루해서 마을 사람들이 달려오는 것을 보려고 처음 거짓 경고를 했다.",
  adv_0568: "박테리아는 미끼 안에서 보호받는 서식 공간을 얻는다. 물고기는 그 빛을 이용해 먹이를 얻는다.",
  adv_0577: "일부 연구에서 친구나 가족 사이의 전염성 하품이 낯선 사람 사이보다 자주 나타났다고 소개한다.",
  adv_0582: "식물과 동물이 먹이·산소·은신처 등을 통해 연결되어 있어 한 부분의 변화가 다른 부분에도 영향을 준다는 것이 핵심이다.",
  adv_0583: "새로 들어온 동물이 원래 살던 생물과 경쟁해 연못 생태계의 균형을 바꿀 수 있기 때문이다.",
  adv_0585: "류 대장은 조용히 기다리는 동안에도 갑작스러운 비상 상황에 대비해 침착하고 주의 깊게 준비된 상태를 유지하는 일이 가장 어렵다고 한다.",
  adv_0587: "같은 동작을 반복하면 익숙해져서 경보에 놀랐을 때도 올바른 절차를 따를 수 있기 때문이다.",
  adv_0589: "항구로 들어온 배에서 두루마리를 찾아 손으로 베껴 도서관용 사본을 만들었다고 한다.",
  adv_0590: "모든 지식을 한곳에 모으려는 도서관의 꿈이 현대의 공공도서관과 인터넷에서도 이어진다는 뜻이다."
};
for (const [id, explanation] of Object.entries(revisedExplanations)) {
  byId.get(id).explanation = explanation;
  note(byId.get(id), "수정 지문에 맞춘 근거 해설");
}

// Difficulty is an app-level estimate of task demand, never a Lexile conversion.
for (const q of bank) {
  const oldDifficulty = q.difficulty;
  if (q.track === "adventure") q.difficulty = q.tags.some(t => ["inference", "main-idea", "idiom", "vocabulary", "cause-effect", "purpose"].includes(t)) ? 3 : 2;
  else q.difficulty = q.tags.some(t => ["past-perfect", "relative-clause", "indirect-question", "passive", "conjunction", "participle", "correlative", "causative", "used-to", "idiom", "it-subject"].includes(t)) ? 3 : 2;
  q.tags = q.tags.filter(t => t !== "advanced");
  if (oldDifficulty !== q.difficulty) note(q, "앱 내 문항 난이도 재분류");
}

// Validate structural invariants and changed content, including Korean UTF-8.
assert.equal(bank.length, 1000);
assert.equal(bank.filter(q => q.track === "adventure").length, 400);
assert.equal(bank.filter(q => q.track === "lfm").length, 600);
assert.equal(new Set(bank.map(q => q.id)).size, 1000);
const signatures = new Set();
const exactDuplicates = [];
for (let i = 0; i < bank.length; i++) {
  const q = bank[i];
  assert.equal(q.id, before[i].id, "IDs and order must remain stable");
  assert.equal(q.track, before[i].track);
  assert.equal(q.answer, before[i].answer, "Keep answer position stable");
  assert.equal(q.type, "mcq");
  assert.equal(q.choices.length, 4);
  assert.equal(new Set(q.choices.map(s => s.trim().toLowerCase())).size, 4, q.id);
  assert(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4);
  assert(q.stem && q.explanation && /[가-힣]/.test(q.explanation), q.id);
  assert(!JSON.stringify(q).includes("\uFFFD"), q.id + " encoding");
  assert(q.difficulty >= 2 && q.difficulty <= 3);
  if (q.track === "adventure") assert(q.passage && !q.passage.includes("p.m.."), q.id);
  if (q.track === "lfm") {
    assert.equal((q.stem.match(/_{3,}/g) || []).length, 1, q.id + " blank count");
    assert(!/\bhave have\b/.test(q.stem.replace(/_{3,}/, q.choices[q.answer])), q.id);
    assert(!q.tags.some(t => ["inversion", "subjunctive", "cleft", "perfect-modal"].includes(t)), q.id);
  }
  const signature = [q.passage || "", q.stem.replace(/_{3,}/g, "___"), q.choices[q.answer]].join("|");
  if (signatures.has(signature)) exactDuplicates.push(q.id);
  signatures.add(signature);
}
assert.deepEqual(exactDuplicates, [], "Duplicate questions after normalizing blank length");
const header = `// Jr. TOEFL Daily — 총 1000문항 (adventure 400 / lfm 600)
// 독해 편집 목표: 800–900L. 공식 Lexile 측정값 또는 인증이 아닙니다.
// LFM은 문법·문맥 난이도로 조정하며, 단문에 Lexile 수치를 부여하지 않습니다.
// difficulty 2/3은 앱 내 과제 난이도이며 Lexile 점수가 아닙니다.
// 원본: data/questions.before-800-900.js
// 재생성: node tools/relevel_questions.js | 검증: node tools/relevel_questions.js --check
// 편집 기준·변경 내역: data/relevel-report.json, data/READABILITY.md
window.QUESTION_BANK = [
`;
const output = header + bank.map(q => "  " + JSON.stringify(q)).join(",\n") + "\n];\n";
const wc = text => (text.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || []).length;
function stats(list) {
  const passages = [...new Set(list.filter(q => q.passage).map(q => q.passage))];
  const words = passages.map(wc).sort((a, b) => a - b);
  return { total: list.length, tracks: Object.fromEntries(["adventure", "lfm"].map(t => [t, list.filter(q => q.track === t).length])), difficulty: list.reduce((a, q) => (a[q.difficulty] = (a[q.difficulty] || 0) + 1, a), {}), uniquePassages: passages.length, passageWords: { min: words[0], median: words[Math.floor(words.length / 2)], max: words.at(-1), mean: +(words.reduce((a,b) => a+b,0) / words.length).toFixed(1) }, answers: [0,1,2,3].map(n => list.filter(q => q.answer === n).length) };
}
const changes = bank.map((q, i) => ({ id: q.id, fields: Object.keys(q).filter(k => JSON.stringify(q[k]) !== JSON.stringify(before[i][k])), reasons: [...(reasons.get(q.id) || [])] })).filter(c => c.fields.length);
const report = {
  target: "800–900L (editorial target only; not measured)",
  lexileMeasured: false,
  methodology: "Connected prose, familiar school and daily-life vocabulary, contextual definitions, moderate clause complexity. Task difficulty reviewed independently. No conversion of word counts or app difficulty to Lexile.",
  before: stats(before), after: stats(bank),
  changedQuestions: changes.length,
  contentChangedQuestions: changes.filter(c => c.fields.some(f => ["passage","stem","choices","explanation"].includes(f))).length,
  exactDuplicates,
  changes
};
if (process.argv.includes("--check")) {
  assert.equal(fs.readFileSync(path.join(ROOT, "questions.js"), "utf8"), output, "Generated bank differs");
  assert.equal(fs.readFileSync(path.join(ROOT, "data/relevel-report.json"), "utf8"), JSON.stringify(report, null, 2) + "\n", "Report differs");
  console.log("PASS: 1000 IDs/order, 400/600 tracks, four unique choices, answer positions, blanks, encoding, target grammar scope, reproducibility.");
} else {
  fs.writeFileSync(path.join(ROOT, "questions.js"), output, "utf8");
  fs.writeFileSync(path.join(ROOT, "data/relevel-report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
}
console.log(JSON.stringify({ before: report.before, after: report.after, changed: changes.length, contentChanged: report.contentChangedQuestions, exactDuplicates }, null, 2));
