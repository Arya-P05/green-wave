import type { Metadata } from "next";
import Link from "next/link";
import { Meta, order, Section, SignOff } from "@/components/shared/Post";
import Toc from "@/components/shared/Toc";
import type { Entry } from "@/components/shared/Toc";
import Picture from "@/components/shared/Picture";

export const metadata: Metadata = {
  title: "the little person",
  description: "why is it so embarrassing to say i want to be great?",
};

const SECTIONS: Entry[] = [
  { id: "3-am", title: "3 am" },
  { id: "the-thing-i-said", title: "how could he say such a thing" },
  { id: "the-cringe", title: "the cringe" },
  { id: "not-the-money", title: "i want to be great" },
  { id: "not-less", title: "the bar i only have for me" },
  { id: "entry-fee", title: "the entry fee" },
  { id: "a-direction", title: "a direction, not a verdict" },
  { id: "what-i-plan-to-do", title: "what i plan to do" },
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
            <Link href="/" aria-label="back to writing" className="arrive text-muted" style={{ ...order(0), textDecoration: "none" }}>
              ←
            </Link>
            <h1 className="arrive mt-1" style={order(1)}>
              the little person
            </h1>
            <p className="arrive text-muted" style={order(2)}>
              why is it so embarrassing to say i want to be great?
            </p>
          </div>
          <p className="arrive" style={order(3)}>
            this &quot;essay&quot; is a weird one to put into words and very different from my other pieces for sure, lol. no simulations or fun research, just some thoughts that i want to voice from a recent night with my friends. a few nights ago i said something out loud to two very close friends of mine. i&apos;m still embarrassed about it. i&apos;m even more embarrassed about putting it online, but, embarrassment is an under explored emotion! so here we are...
          </p>
        </header>

        <Section id="3-am" title="3 am">
          <Picture src="/greatness/ceiling-3am.png" alt="A top-down sketch: a bed with two pillows, one stick figure lying on it with his head between the pillows, and a sofa pushed against its foot with two more stick figures, heads at the bottom, legs reaching up onto the bed." width={1000} height={972} side="right" offset={26} />
          <p>
            we were having a sleepover (highly recommend sleepovers as adults btw) and it had been a really long time since all of us were together. for context, we all grew up on the same street in brampton, ontario, canada and now, somehow, we&apos;re all together in the bay. it was cool to think about how far we’ve come, and how crazy it felt
          </p>
        </Section>

        <Section id="the-basement">
          <p>
            i ended up asking: &quot;highlight of the past year, saddest moment of the past year, and overall happiness out of 10&quot;. which prompted a lot of honest conversation between us three. which than eventually led me to saying...
          </p>
        </Section>

        <Section id="the-thing-i-said" title="how could he say such a thing">
          <p>
            &quot;bro i don&apos;t know, it’s weird to say this out loud, but like there’s this thing in me. it&apos;s like a little person who’s constantly, no matter what i do or achieve, that&apos;s telling me that i need to strive for greatness.
          </p>
          <p>
            and don&apos;t get me wrong, like genuinely i’m soooo lucky, i know that, and i think i mean it too. but for some reason i’m just always like, i need to be great. people need to know about me. i need to change people’s lives. i want to make an impact at a scale where people know me as a great human.&quot;
          </p>
        </Section>

        <Section id="the-cringe" title="the cringe">
          <p>
            LMAOOOOO as i read this out loud i can&apos;t stop cringing, because holy shit, &quot;people need to know about me&quot; is absurd, who do i think i am :skull:
          </p>
          <p>
            and on top of the cringe, it feels selfish. if i want people to know me, then i want attention, and wanting attention feels like a character flaw. if i want to change people’s lives, do i think i’m better than them? it makes me question if im evil.
          </p>
          <Picture src="/little-person/bruegel-icarus.webp" alt="A painted coastal landscape: a ploughman, a shepherd and a fishing boat go about their day while, small in the bottom right corner, a pair of legs disappears into the sea." width={1600} height={1043} caption="the Fall of Icarus, after Pieter Bruegel the Elder (Royal Museums of Fine Arts of Belgium)" note="Icarus flew too close to the sun, but in reality he&apos;s just a tiny pair of legs splashing into the sea (bottom right). Everyone else, the farmer, the shepherd and the ship, all do their thing. The world doesn&apos;t even notice." />
        </Section>

        <Section id="not-the-money" title="i want to be great">
          <p>
            btw, this isn&apos;t about money. yes, i want a lot of money, but i couldn&apos;t care to be the richest person on earth if it meant being anonymous. that&apos;s not what the little person inside me is saying.
          </p>
        </Section>

        <Section id="what-is-great">
          <p>
            ok so zooming out for a sec, because everything above kind of makes it sound like i just want to be a good person and have people know it, and that&apos;s not really it. i want to be great. like genuinely, i want to do meaningful things with my life. i want to change lives. i want to change the future. i want to be in textbooks.
          </p>
          <p>
            and the dumb part is i can&apos;t even tell you exactly what that looks like. it&apos;s not a job title and it&apos;s not a number. it&apos;s more like that little person inside me saying i should always be doing more so i can be greater.
          </p>
          <p>
            the polite version of this would be &quot;i just want to make an impact.&quot; that&apos;s the one you&apos;re allowed to say out loud at a dinner. the honest version is that i want to be in textbooks. i want someone in the future to read about something i did. it&apos;s what&apos;s actually in there, and i&apos;m kind of tired of dressing it up as something smaller.
          </p>
        </Section>

        <Section id="not-less" title="the bar i only have for me">
          <p>
            does that mean people who aren&apos;t doing big things aren&apos;t great? no. obviously not.
          </p>
          <p>
            but i feel like i&apos;m not if i&apos;m not doing that. like it&apos;s a scoreboard that only i&apos;m on, and it has exactly one line on it: have you changed anything yet. until the answer is yes, i don&apos;t feel like i&apos;m enough. (yes i broke a world record with my hackathon team in university. cool fun fact, lowkey who cares.)
          </p>
          <p>
            and the lucky thing makes it worse. i&apos;d like to believe that i understand how privileged and lucky i am, and so how am i still sitting here feeling like this? it feels ungrateful. but i think being grateful and being hungry aren&apos;t opposites, they just sit in the same body and don&apos;t cancel each other out.
          </p>
        </Section>

        <Section id="known">
          <p>
            “change people’s lives” sounds noble but the latter half of that sentence being there makes everything the complete opposite of noble.
          </p>
          <p>
            so i did a thought experiment. i made myself imagine that i did all of this great work all over the world and nobody ever knew it was me. would i be fine with that? i honestly don’t know. some days the answer is obviously yes, the point is the lives got better. some days i can feel a part of me being a little disappointed, like it did all that work and didn’t get to see the crowd.
          </p>
          <p>
            that’s what scares me, not that i want it, but that i can’t tell how much is the good version and how much is the hungry for attention version. from the inside, they feel exactly the same.
          </p>
        </Section>

        <Section id="entry-fee" title="the entry fee">
          <p>
            so i went and read some people way smarter than me, mostly to find out if this is just a me problem.
          </p>
          <p>
            ernest becker wrote a whole book called the denial of death, and there&apos;s a line in it that kind of calls out everyone at once. he says it&apos;s man&apos;s tragic destiny that &quot;he must desperately justify himself as an object of primary value in the universe; he must stand out, be a hero, make the biggest possible contribution to world life, show that he counts more than anything or anyone else.&quot; (he&apos;s explaining why siblings fight over who got the bigger piece of candy lol)
          </p>
          <p>
            so the wanting might not be the weird part. this made me feel slightly better about myself, because maybe the wanting is the default setting and most people just never say it out loud.
          </p>
          <p>
            and then there&apos;s richard hamming, who spent decades at bell labs watching why some scientists did great work and most didn&apos;t, and gave this talk called you and your research. in it, he says this one line that i can&apos;t stop thinking about: &quot;Once you get your courage up and believe that you can do important problems, then you can. If you think you can&apos;t, almost surely you are not going to.&quot; so, uh, the exact thing i find cringe, believing i could do something that matters, is the entry fee according to him.
          </p>
          <p>
            you can&apos;t be too embarrassed to want it and also go do it.
          </p>
        </Section>

        <Section id="a-direction" title="a direction, not a verdict">
          <p>
            which changes what i think the little person is. i&apos;ve been treating it like a judge. it keeps score, i&apos;m never at the top of it, and that&apos;s why i never feel like enough. but a scoreboard can only ever say &quot;not yet.&quot; what if it&apos;s less a verdict and more a direction? like it&apos;s not saying &quot;you are not great,&quot; it&apos;s saying &quot;aim higher than this.&quot;
          </p>
          <p>
            hamming has a story about this. he used to eat lunch with the chemistry people at bell labs and ask them &quot;What are the important problems of your field?&quot; and after a week or so, &quot;What important problems are you working on?&quot; and then one day, &quot;If what you are doing is not important, and if you don&apos;t think it is going to lead to something important, why are you at Bell Labs working on it?&quot;
          </p>
          <p>
            and that&apos;s the real question i think i ask myself. not &quot;am i great,&quot; but &quot;what&apos;s the important thing, and am i working towards it?&quot;
          </p>
          <Picture src="/little-person/emerson-1846.webp" alt="An 1846 daguerreotype portrait of Ralph Waldo Emerson, seated and looking slightly off to one side." width={350} height={524} caption="Ralph Waldo Emerson, daguerreotype by Albert Southworth, 1846" side="right" offset={19} />
          <p>
            and emerson, in an essay called civilization, says &quot;To accomplish anything excellent the will must work for catholic and universal ends.&quot; (catholic there just means universal.) which is a very 1870 way of saying the wanting only works when it points at something bigger than me.
          </p>
        </Section>

        <Section id="what-i-plan-to-do" title="what i plan to do">
          <p>
            the last thing i ended up reading is by mary oliver, from a poem that&apos;s mostly about a grasshopper. it says &quot;Doesn&apos;t everything die at last, and too soon?&quot; and then &quot;Tell me, what is it you plan to do / with your one wild and precious life?&quot;
          </p>
          <p>
            i think that&apos;s what the textbooks thing was always about. everything does die at last and too soon, and some part of me wants whatever i do to outlast me. (which, yeah, is the denial of death but thats another topic...) but looking at what oliver actually asks, you see that it&apos;s not &quot;will you be great&quot; or &quot;will people know,&quot; just what do you plan to do.
          </p>
          <p>
            do i know what that is, no, i don&apos;t have a clean answer. but i think i&apos;d rather have a little person who points me at something than one who just keeps score.
          </p>
          <p>
            so i take my embarrassment turning into a deep dive of literature turning into reflection turning into this realization, a good thing.
          </p>
          <p>
            something, i&apos;m glad happened.
          </p>
        </Section>

        <Section id="is-it-smart-to-write-this" title="is it smart to write this?">
          <p>
            uhhh not exactly sure. definitely feels vulnerable and someone can very easily read this and decide i’m exactly the cocky evil greedy man that i am scared to be perceived as.
          </p>
          <p>
            but i’d like to think that there’s somebody out there with their own little person who’s never said it, and who might feel a bit less alone reading this.
          </p>
          <p>
            if that’s you, hi.
          </p>
          <p>
            we’re figuring out life together :)
          </p>
        </Section>

        <Meta rows={META} />
        <SignOff />
      </article>
    </main>
  );
}
