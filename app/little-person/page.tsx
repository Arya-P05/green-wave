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
  { id: "the-standup", title: "the standup" },
  { id: "the-thing-i-said", title: "the thing i said" },
  { id: "the-cringe", title: "the cringe" },
  { id: "not-the-money", title: "not the money" },
  { id: "known", title: "known" },
  { id: "lucky", title: "lucky" },
  { id: "where-she-comes-from", title: "where she comes from" },
  { id: "ego-or-impact", title: "ego or impact" },
  { id: "what-they-said", title: "what they said" },
  { id: "after", title: "after" },
  { id: "what-i-do-with-her", title: "what i do with her" },
  { id: "so-is-it-smart-to-write-this", title: "so, is it smart to write this?" },
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
            so this is a weird one to write. it’s not a simulation and there’s nothing to play with. it’s one night and one thing i said out loud, and i’m still low-key embarrassed about it. i wasn’t even sure it was smart to write this. it sounds like a thing you’re supposed to keep to yourself. but then i thought, that’s kind of the whole point of the post, so here we are.
          </p>
        </header>

        <nav aria-label="contents" className="mt-2 md:hidden">
          <Toc entries={SECTIONS} />
        </nav>

        <Section id="3-am" title="3 am">
          <p>
            we were supposed to be asleep hours ago, like genuinely hours. instead it was 3 am and the three of us were lying on our backs staring at the ceiling in the funniest position possible. one of us was on the bed. then we’d dragged the sofa up against the end of it, and the other two were lying on the sofa with our legs going up over the back and onto the bed, so everyone’s feet ended up in the middle in this big tangle. i drew it, it’s up there. it’s not a good drawing and i love it.
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
            how did we get there? we’d been up all night playing poker (pretty sure Dhairya won), then Sequence, then more Sequence, laughing soooo much at the most random jokes. and then after the last game we kind of just died down. nobody said anything for a while. it was the good kind of quiet.
          </p>
        </Section>

        <Section id="the-basement" title="the basement">
          <p>
            it had been a really long time since all of us were together like that. we grew up on the same street in Brampton, and now somehow we were all in Dipen’s house in the Bay. like how did that happen. and the thing that kept coming back to me was that this could very well be the same basement we played Monopoly in every single night during covid, like 7 years ago. same people, same late-night energy. it’s just that now it’s the Bay.
          </p>
          <p>
            we were all kind of thinking about how far we’ve come, and also how crazy it is that we’re still the same people. that combination is a strange thing to sit in at 3 am. you feel really proud and really small at the same time.
          </p>
        </Section>

        <Section id="the-standup" title="the standup">
          <p>
            and then i did what i always do when a moment gets too soft, which is turn it into a bit. i basically started doing a standup lmaooo. okay everyone, three questions. what was your highlight of the past year. what was your saddest moment of the past year. and overall happiness out of 10.
          </p>
          <p>
            it’s a joke format, but it works way better than it should. you can’t really give a fake answer to “saddest moment.” the jokes stopped pretty quick and we actually started talking, like really talking, and somewhere in there we got to the thing i’m trying to write about.
          </p>
        </Section>

        <Section id="the-thing-i-said" title="the thing i said">
          <p>
            i don’t remember the exact words. it was probably something like: bro idk, it’s so weird to say this, but there’s this thing in me. this little person who is always like you need to strive for greatness.
          </p>
          <p>
            like i’m soooo lucky. i can say that, and i mean it. but for some reason i am just always like, i need to be great. people need to know about me. i need to change people’s lives. i want to make an impact at a scale where people know me as a great human.
          </p>
          <p>
            and then it was out there, said to a ceiling at 3 am, and i couldn’t take it back.
          </p>
        </Section>

        <Section id="the-cringe" title="the cringe">
          <p>
            here’s the first thing i noticed. it is so cringe to say that out loud. like genuinely cringe. “i want to be great.” who says that? it sounds like a LinkedIn bio written by a villain.
          </p>
          <p>
            and it’s not just cringe, it’s something more than that. it feels selfish. if i want people to know me, then i want attention, and wanting attention feels like a character flaw. if i want to change people’s lives, does that mean i think i’m better than them? that i’m the main character? it starts to feel not just embarrassing but kind of evil. like the kind of thing a person wants right before they do something bad.
          </p>
          <p>
            i genuinely don’t know if that’s a fair read of myself or if it’s just the voice of every polite person i’ve ever been around. we’re all taught pretty hard not to want too much. you can want to be happy, you can want to be good at your job, but you’re supposed to say you want to be “comfortable.” wanting to be great is rude.
          </p>
        </Section>

        <Section id="not-the-money" title="not the money">
          <p>
            i want to get one thing out of the way, because it’s what people assume. it’s not about money. i mean, yes, i want a lot of money, i’m not going to lie to you. but if you told me the goal was to be the richest person alive, it would feel empty. that’s not the thing that the little person is yelling about.
          </p>
          <p>
            what she wants is for me to be a great human. and, this is the embarrassing part, to be known for it. it’s two things stuck together: being good, and people knowing that i’m good. and i can’t fully pull them apart, which is kind of the problem.
          </p>
        </Section>

        <Section id="known" title="known">
          <p>
            so why do i want to be known? this is the one i think about the most, because it’s the part that makes me feel the worst.
          </p>
          <p>
            if i say i want to change people’s lives, that sounds noble. but “people need to know about me” is right there in the same sentence, and it’s not noble at all. it’s just wanting an audience.
          </p>
          <p>
            here’s a test i tried on myself. imagine i did all the great stuff and nobody ever knew it was me. would i be happy with that? and i honestly don’t know. some days the answer is yes, obviously, the point is the lives. and some days i can feel that something in me would be a little bit disappointed, like it did all that work and didn’t get to see the crowd.
          </p>
          <p>
            i think that’s what scares me most. not that i want it, but that i can’t tell how much of it is the good version and how much is the hungry-for-attention version. they feel exactly the same from the inside.
          </p>
        </Section>

        <Section id="lucky" title="lucky">
          <p>
            the other thing is that i really do feel lucky, and i don’t mean that as a throwaway. i have a life that a lot of people would trade for. and so the voice saying “you need to be great” sometimes feels ungrateful, like i’ve been handed this much and i’m still sitting here wanting more. isn’t the point of being lucky that you’re supposed to be satisfied?
          </p>
          <p>
            but it doesn’t work like that. being grateful and being hungry aren’t opposites, it turns out. they just sit in the same body at the same time and don’t cancel out. i can look around at my life and be genuinely thankful, and the little person is still in the back going okay, and what’s next.
          </p>
          <p>
            i used to think one of them was the real me and the other was a glitch. now i think they’re both just me.
          </p>
        </Section>

        <Section id="where-she-comes-from" title="where she comes from">
          <p>
            i don’t know where the little person comes from, which is annoying. i have guesses and none of them feel proven. maybe it’s just wanting my life to count for something. maybe it’s growing up around people i really love and never wanting to waste the fact that we all got out of the same street. maybe it’s just the internet showing me what everyone else is doing. maybe it’s all three, or maybe it’s none of them and i’m making up a story because stories feel better than not knowing.
          </p>
          <p>
            what i do know is that she’s been there for a long time, and she’s pretty loud, and i’ve mostly been pretending she’s not.
          </p>
        </Section>

        <Section id="ego-or-impact" title="ego or impact">
          <p>
            the question i keep coming back to is whether this is ego or whether it’s wanting impact. and the more i think about it, the less sure i am that those are actually two different things.
          </p>
          <p>
            if it’s ego, then it’s about me: how i look, who knows my name, whether i’m special. if it’s impact, then it’s about everyone else: whether anything actually got better because i showed up. and the problem is that both of them say the exact same sentence. “i want to make a difference.” you can’t tell them apart from the words.
          </p>
          <p>
            the only difference i can think of is what happens when someone else does it better. if somebody else fixed the thing i was going to fix, and fixed it better, and nobody ever heard my name, would i be glad? i’d like to say yes. i think the honest answer is yes, mostly, but with a little sting. and maybe that sting is just the ego, and maybe that’s okay as long as i know it’s there and it’s not the one steering.
          </p>
          <p>
            i’m still not sure about that, though.
          </p>
        </Section>

        <Section id="what-they-said" title="what they said">
          <p>
            [this part is yours. how did Dipen and Dhairya react when you said it? what did either of them say back? and what did you say after that? write what actually happened here, i don’t want to make it up.]
          </p>
        </Section>

        <Section id="after" title="after">
          <p>
            [how did it feel right after you said it? lighter, weirder, worse? in your own words, i don’t want to guess.]
          </p>
          <p>
            what i do know is that it’s a lot of work to hide something this loud, and i’d been doing it for a long time.
          </p>
        </Section>

        <Section id="what-i-do-with-her" title="what i do with her">
          <p>
            i don’t have a clean answer for this, which is a weird place to end a post. but here’s what i’m trying.
          </p>
          <p>
            the first thing is just to stop pretending she’s not there. saying it out loud once, at 3 am, to the people i grew up with, is a start. it’s hard to stay ashamed of something once it’s out of your head.
          </p>
          <p>
            the second is to try aiming her at things instead of at myself. “be great” is too big and too vague. it’s a feeling, not a plan. but “make this one thing actually good for someone” is something i can do on a regular Tuesday. if the little person wants to be great, she can start by being useful.
          </p>
          <p>
            and the third, which i’m still working out, is to be honest about the mixed motives. i probably won’t ever get a pure version where it’s all impact and no ego. i’d rather know both are in there and keep an eye on which one is driving.
          </p>
        </Section>

        <Section id="so-is-it-smart-to-write-this" title="so, is it smart to write this?">
          <p>
            i still don’t know. it feels a little reckless to put this on the internet. someone could read it and decide i’m exactly the villain i was scared i sounded like.
          </p>
          <p>
            but i keep thinking about the ceiling. three people, 3 am, and the embarrassing thing finally said out loud. i’d like to think there’s somebody out there with their own little person in the back, who’s never said it out loud, and who might feel a bit less alone reading this.
          </p>
          <p>
            if that’s you, hi. it’s not evil. i think it’s just a really loud kind of wanting, and we’re still figuring out what to point it at.
          </p>
        </Section>

        <Meta rows={META} />
        <SignOff />
      </article>
    </main>
  );
}
