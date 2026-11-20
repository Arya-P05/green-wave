import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Meta, order, Section, SignOff } from "@/components/shared/Post";
import Toc from "@/components/shared/Toc";
import type { Entry } from "@/components/shared/Toc";

export const metadata: Metadata = {
  title: "the little person",
  description: "why is it so embarrassing to say i want to be great?",
};

const SECTIONS: Entry[] = [
  { id: "3-am", title: "3 am" },
  { id: "the-basement", title: "the basement" },
  { id: "the-thing-i-said", title: "the thing i said" },
  { id: "the-cringe", title: "the cringe" },
  { id: "not-the-money", title: "not the money" },
  { id: "known", title: "known" },
  { id: "lucky", title: "lucky" },
  { id: "ego-or-impact", title: "ego or impact" },
  { id: "what-they-said", title: "what they said" },
  { id: "what-i-do-with-her", title: "what i do with her" },
  { id: "is-it-smart-to-write-this", title: "is it smart to write this?" },
];

const META: [string, React.ReactNode][] = [["when", "November 2026"]];

export default function LittlePerson() {
  return (
    <main className="grid gap-x-4 px-1 py-4 sm:px-4 md:grid-cols-[18ch_minmax(0,1fr)]">
      <nav aria-label="contents" className="hidden md:block">
        <div className="sticky top-4">
          <Toc entries={SECTIONS} />
        </div>
      </nav>

      <article className="max-w-[96ch]">
        <header className="grid gap-y-1">
          <div>
            <Link href="/" className="arrive" style={order(0)}>
              Arya Patel
            </Link>
            <h1 className="arrive mt-1" style={order(1)}>
              the little person
            </h1>
            <p className="arrive text-muted" style={order(2)}>
              why is it so embarrassing to say i want to be great?
            </p>
          </div>
          <p className="arrive" style={order(3)}>
            this one’s weird to write. there’s nothing to play with and no simulation, just one night and one thing i said out loud that i’m still low-key embarrassed about. i wasn’t even sure it was smart to put this online. but that’s kind of the whole point of the post, so here we are.
          </p>
        </header>

        <nav aria-label="contents" className="mt-2 md:hidden">
          <Toc entries={SECTIONS} />
        </nav>

        <Section id="3-am" title="3 am">
          <p>
            we were supposed to be asleep hours ago, like genuinely hours. instead it was 3 am and the three of us were lying on our backs staring at the ceiling in the funniest position possible. one of us was on the bed, we’d dragged the sofa up against the end of it, and the other two were on the sofa with our legs going up over the back and onto the bed, so everyone’s feet ended up in the middle in this big tangle. i drew it, it’s right below. it’s not a good drawing and i love it.
          </p>
          <figure className="my-2 grid max-w-[44ch] gap-y-1">
            <Image
              src="/greatness/ceiling-3am.png"
              alt="A top-down sketch: a bed with two pillows, one stick figure lying on it with his head between the pillows, and a sofa pushed against its foot with two more stick figures, heads at the bottom, legs reaching up onto the bed."
              width={1000}
              height={972}
              sizes="(max-width: 640px) 100vw, 400px"
              className="w-full"
            />
            <figcaption className="text-muted">The 3 am setup, from above. My sketch.</figcaption>
          </figure>
          <p>
            we’d been up all night playing poker (pretty sure Dhairya won), then Sequence, then more Sequence, laughing soooo much at the most random jokes. and after the last game we just kind of died down.
          </p>
        </Section>

        <Section id="the-basement" title="the basement">
          <p>
            it had been a really long time since all of us were together like that. we grew up on the same street in Brampton, and now somehow we were all in Dipen’s house in the Bay. this could very well be the same basement we played Monopoly in every single night during covid, like 7 years ago. we were thinking about how far we’ve come, and how crazy that is.
          </p>
          <p>
            so obviously i turned it into a standup lmaooo. okay everyone: highlight of the past year, saddest moment of the past year, and overall happiness out of 10. it works way better than it should, because you can’t fake an answer to “saddest moment.” the jokes stopped pretty quick and we actually started talking, and somewhere in there we got to the thing i’m trying to write about.
          </p>
        </Section>

        <Section id="the-thing-i-said" title="the thing i said">
          <p>
            i don’t remember the exact words. it was probably something like: bro idk, it’s so weird to say this, but there’s this thing in me. this little person who’s always like you need to strive for greatness.
          </p>
          <p>
            like i’m soooo lucky, i can say that and mean it. but for some reason i’m just always like, i need to be great. people need to know about me. i need to change people’s lives. i want to make an impact at a scale where people know me as a great human.
          </p>
          <p>
            and then it was out there, said to a ceiling at 3 am, and i couldn’t take it back.
          </p>
        </Section>

        <Section id="the-cringe" title="the cringe">
          <p>
            first thing i noticed: it is so cringe to say out loud. “i want to be great.” who says that? it sounds like a LinkedIn bio written by a villain.
          </p>
          <p>
            and it’s more than cringe, it feels selfish. if i want people to know me, then i want attention, and wanting attention feels like a character flaw. if i want to change people’s lives, do i think i’m better than them? it starts to feel kind of evil, like the thing someone wants right before they do something bad.
          </p>
        </Section>

        <Section id="not-the-money" title="not the money">
          <p>
            it’s not about money. yes, i want a lot of money, i’m not going to lie to you. but if the goal was to be the richest person alive it would feel empty. that’s not what the little person is yelling about.
          </p>
          <p>
            she wants me to be a great human. and here’s the embarrassing part: to be known for it. it’s two things stuck together, being good and people knowing i’m good, and i can’t fully pull them apart.
          </p>
        </Section>

        <Section id="known" title="known">
          <p>
            “change people’s lives” sounds noble. “people need to know about me” is right there in the same sentence and it’s not noble at all, it’s just wanting an audience.
          </p>
          <p>
            so i tried a test. imagine i did all of it and nobody ever knew it was me. would i be fine with that? i honestly don’t know. some days the answer is obviously yes, the point is the lives. some days i can feel a part of me being a little disappointed, like it did all that work and didn’t get to see the crowd.
          </p>
          <p>
            that’s what scares me, not that i want it, but that i can’t tell how much is the good version and how much is the hungry-for-attention version. from the inside they feel exactly the same.
          </p>
        </Section>

        <Section id="lucky" title="lucky">
          <p>
            and i really do feel lucky, i’m not saying it as a throwaway. so the voice saying “you need to be great” can feel ungrateful, like i’ve been handed this much and i’m still sitting here wanting more. isn’t being lucky supposed to mean you’re satisfied?
          </p>
          <p>
            turns out grateful and hungry aren’t opposites. they sit in the same body and don’t cancel out. i can look around and be genuinely thankful and the little person is still in the back going okay, and what’s next.
          </p>
        </Section>

        <Section id="ego-or-impact" title="ego or impact">
          <p>
            i keep asking whether this is ego or wanting impact, and the more i think about it the less sure i am they’re two different things. if it’s ego it’s about me: who knows my name, whether i’m special. if it’s impact it’s about everyone else: whether anything got better because i showed up. and both of them say the exact same sentence, “i want to make a difference.” you can’t tell them apart from the words.
          </p>
          <p>
            the only difference i can think of is what happens when someone else does it better. if somebody fixed the thing i was going to fix, and nobody ever heard my name, would i be glad? i’d like to say yes. maybe the honest answer is yes with a little sting, and maybe the sting is just the ego, and maybe that’s okay as long as i know it’s there and it’s not the one steering.
          </p>
        </Section>

        <Section id="what-they-said" title="what they said">
          <p>
            [this part is yours. how did Dipen and Dhairya react when you said it? what did either of them say back? and how did it feel right after? write what actually happened, i don’t want to make it up.]
          </p>
        </Section>

        <Section id="what-i-do-with-her" title="what i do with her">
          <p>
            i don’t have a clean answer, which is a weird place to end a post, but here’s what i’m trying.
          </p>
          <p>
            stop pretending she’s not there. saying it out loud once, at 3 am, to the people i grew up with, is a start. it’s hard to stay ashamed of something once it’s out of your head.
          </p>
          <p>
            aim her at things instead of at me. and be honest that both motives are in there. “be great” is too big, it’s a feeling and not a plan. but “make this one thing actually good for someone” is something i can do on a regular Tuesday. if she wants me to be great, she can start by being useful.
          </p>
        </Section>

        <Section id="is-it-smart-to-write-this" title="is it smart to write this?">
          <p>
            still don’t know. it feels a little reckless, and someone could read this and decide i’m exactly the villain i was scared i sounded like.
          </p>
          <p>
            but i keep thinking about the ceiling: three people, 3 am, and the embarrassing thing finally said out loud. i’d like to think there’s somebody out there with their own little person in the back who’s never said it, and who might feel a bit less alone reading this. if that’s you, hi. it’s not evil. i think it’s just a really loud kind of wanting, and we’re still figuring out what to point it at.
          </p>
        </Section>

        <Meta rows={META} />
        <SignOff />
      </article>
    </main>
  );
}
