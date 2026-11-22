import type { Metadata } from "next";
import Link from "next/link";
import Blur from "@/components/iphone-photos/Blur";
import Distance from "@/components/iphone-photos/Distance";
import Exposure from "@/components/iphone-photos/Exposure";
import Frame from "@/components/iphone-photos/Frame";
import Light from "@/components/iphone-photos/Light";
import PhotoSlot from "@/components/iphone-photos/PhotoSlot";
import Nerds from "@/components/shared/Nerds";
import Picture from "@/components/shared/Picture";
import { Meta, order, Section, SignOff } from "@/components/shared/Post";
import Toc from "@/components/shared/Toc";
import { requireReleased } from "../writings";
import type { Entry } from "@/components/shared/Toc";

export const metadata: Metadata = {
  title: "almost good",
  description:
    "how do you take really good iphone photos? the usual tips, checked against the research, with five small drawings to play with.",
};

const CODE = "https://github.com/Arya-P05/green-wave";

/** Everything the post leans on. Each was opened and read; docs/iphone-photos/SOURCES.md says what each supports. */
const SRC = {
  palmer: "https://palmerlab.berkeley.edu/pdf/PalmerGardner%26Wickens-1.pdf",
  amirshahi: "https://doi.org/10.1163/22134913-00002024",
  ke: "https://mmlab.ie.cuhk.edu.hk/pdf/keTJ_CVPR06.pdf",
  johnston: "https://doi.org/10.1068/p210365",
  ward: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5876805/",
  bryan: "https://doi.org/10.1371/journal.pone.0045301",
  tools: "https://support.apple.com/guide/iphone/use-camera-tools-iph3dc593597/ios",
  night: "https://support.apple.com/en-us/102519",
  portrait: "https://support.apple.com/en-us/102398",
  styles: "https://support.apple.com/guide/iphone/use-photographic-styles-iph629d2cd37/ios",
  basics: "https://support.apple.com/guide/iphone/camera-basics-iph263472f78/ios",
  specs: "https://www.apple.com/iphone-17/specs/",
  dof: "https://en.wikipedia.org/wiki/Depth_of_field#Foreground_and_background_blur",
};

const SECTIONS: Entry[] = [
  { id: "photo", title: "exhibit a" },
  { id: "frame", title: "where to stand" },
  { id: "light", title: "the light on your face" },
  { id: "exposure", title: "too bright, too dark" },
  { id: "background", title: "everything behind you" },
  { id: "lens", title: "0.5x, 1x, 2x" },
  { id: "night", title: "night" },
  { id: "matters", title: "the cheat sheet" },
  { id: "next", title: "next trip" },
  { id: "notes", title: "notes" },
];

const META: [string, React.ReactNode][] = [
  ["tools", "TypeScript, Next.js, SVG and a small ray marcher on a canvas, no libraries"],
  ["data", "published studies and Apple’s own guides (sources in the notes); the photos are mine, the old pictures are public domain"],
  ["code", <a key="code" href={CODE}>github.com/Arya-P05/green-wave</a>],
];

export default function IphonePhotos() {
  requireReleased("iphone-photos");
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
              almost good
            </h1>
            <p className="arrive text-muted" style={order(2)}>
              how do you take really good iphone photos?
            </p>
          </div>
          {/* <!-- ARYA-TWEAK --> */}
          <p className="arrive" style={order(3)}>
            you know that feeling when you get back from a trip, open your camera roll, and scroll through like… huh.
            the place was beautiful, the moment was fun, and the photo is… fine. i take a lot of photos on trips, almost
            all of them on my phone, and most of them are almost good.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p className="arrive" style={order(4)}>
            so i went looking for what actually makes a phone photo better, and which of the usual tips have real evidence
            behind them. some do! some, like the rule of thirds, have way less than i thought. along the way there are five
            small drawings you can play with, and a few of my own photos, flaws and all.
          </p>
        </header>

        <Section id="photo" title="exhibit a">
          <PhotoSlot
            name="milan-duomo.jpg"
            ratio={[3, 4]}
            narrow
            alt="Me, small in the middle of the frame, in front of the Milan Cathedral in harsh midday sun, with a hard shadow and a deep blue sky."
          >
            Milan. Centred, tiny, squinting.
          </PhotoSlot>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            this is me in front of the milan cathedral. i’d wanted to see it for years, and it did not disappoint. the photo
            has a deep blue sky and the whole cathedral in it, and then there’s me: a small person in the middle, squinting,
            with a hard black shadow next to me and tourists all around.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p>
            nothing in it is broken. the phone did its job. but it has most of the problems this post is about: where i am in
            the frame, what the light is doing to my face, and how much else is going on around me. so let’s take them one at
            a time, starting with the one everyone has heard of.
          </p>
        </Section>

        <Section id="frame" title="where to stand">
          <p>
            the rule of thirds says to split the frame into a three-by-three grid and put your subject on one of the lines,
            not in the middle. your iphone will even <a href={SRC.tools}>draw the grid</a> for you (settings, camera, grid).
            it’s in nearly every photography guide, so i expected it to have tons of research behind it.
          </p>
          <p>
            <span className="text-ink">it mostly doesn’t.</span> in 2008, stephen palmer and his colleagues at berkeley
            showed people pictures of a single thing (a person, a car, a teapot) at different spots in a frame, and asked
            which they liked better. here’s what they found:
          </p>
          <ul className="grid gap-y-1">
            <li>
              something facing you? people liked it <a href={SRC.palmer}>in the centre</a>, and liked it less the further it
              moved out.
            </li>
            <li>
              something facing sideways? a little off-centre was nice, but only on the side that left it looking{" "}
              <i>into</i> the frame. facing out of the frame, with its back to the empty space, was disliked even on a third
              line.
            </li>
            <li>the sweet spots were around 42% and 58% of the way across. not the third lines.</li>
          </ul>
          <p>
            the authors summed up their results as consistent with the rule of thirds “at best, one-third of the time.” which
            is kind of a perfect academic roast.
          </p>
          <p>
            a 2014 study came at it from the other direction. people rated photos, and the researchers measured how closely
            each photo followed the rule. the link with how much people liked a photo was <a href={SRC.amirshahi}>weak</a>,
            and the most highly rated photos (and a large set of paintings) followed the rule about as little as photos that
            ignored it. their words: it plays “only a minor, if any, role.”
          </p>
          <Frame />
          <p>
            so what does matter? that it’s obvious what you’re meant to look at. when researchers asked photographers and
            non-photographers what separates professional photos from snapshots, the main answer was{" "}
            <a href={SRC.ke}>simplicity</a>: the subject is easy to pick out from the background. and when they measured
            photos, the professional ones had their detail gathered toward the middle, while the snapshots had busy clutter
            all the way out to the edges.
          </p>
          <p>
            so in the milan photo, being in the middle was fine. facing the camera, the middle is where people like you. the
            problem is how small i am. the cathedral wins, and i look like i wandered into someone else’s picture. either step
            closer so i’m clearly the subject, or let the cathedral be the photo on purpose.
          </p>
          <Nerds title="the other grids">
            <p>
              The phi grid (lines at 38% and 62% instead of 33% and 67%) comes from the golden ratio. I couldn’t find any study
              showing it beats the thirds, or the centre. Same for leading lines and for exactly how much room to leave above a
              head: these are good habits that photographers agree on, but I didn’t find evidence for them, so take them as
              taste.
            </p>
            <p>
              One caveat on Palmer’s work: the pictures were single objects on plain backgrounds. Real photos have other things in
              them, and the authors say themselves that this would presumably change people’s answers.
            </p>
          </Nerds>
        </Section>

        <Section id="light" title="the light on your face">
          <p>
            the same milan photo has a second problem, and honestly it’s the bigger one. it was midday, so the sun was almost
            straight above me. light from the top fills your eye sockets with shadow, puts a dark patch under your nose and
            chin, and makes you squint. (hence: squinting.)
          </p>
          <p>two things decide what light does to a face:</p>
          <ul className="grid gap-y-1">
            <li>
              <span className="text-ink">where it comes from.</span> above, the side, behind, below.
            </li>
            <li>
              <span className="text-ink">how big it is</span> compared with you.
            </li>
          </ul>
          <p>
            the second one is just geometry, not a study. the sun is a tiny dot in the sky, so it makes shadows with sharp
            edges. a window or a cloudy sky is huge, so every part of your face gets light from lots of angles at once, and
            the edges of the shadows go soft. play with it:
          </p>
          <Light />
          <p>
            the one part of this with real research behind it is light from below. our eyes assume light comes from above, and
            a 1992 study concluded that lighting a face <a href={SRC.johnston}>from below</a> disrupts how we build up its 3D
            shape. that’s probably why the flashlight-under-the-chin face looks so wrong.
          </p>
          <p>
            it’s also part of why golden hour works. when the sun is low, it comes from the side instead of the top, so you get
            the side-light look instead of the midday one.
          </p>
          <PhotoSlot
            name="golden-gate-backlit.jpg"
            ratio={[4, 3]}
            alt="Me with my eyes closed, smiling, centred, with the sun directly behind my head and the Golden Gate Bridge behind me. Strong backlight and a warm glow."
          >
            The Golden Gate, with the sun right behind me.
          </PhotoSlot>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            this one is backlight done mostly right. the sun is right behind my head, so there’s a warm glow around my hair and
            the whole thing feels soft. because my eyes are closed, i’m not squinting into anything. the catch is my face: it’s
            in its own shadow, so it comes out a bit flat. which brings us to exposure.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="exposure" title="too bright, too dark">
          <p>
            every photo, the camera has to decide how bright to make it. it measures the light, then picks a brightness that
            makes whatever it measured come out a middle grey. the trouble is that a sensor can only hold so much range. when a
            face is in shade in front of a bright sky, the camera can’t keep both. something turns pure white, or pure black.
          </p>
          <Exposure />
          <Picture src="/iphone-photos/niepce-1827.webp" alt="The oldest surviving photograph: a blurry, grey view over rooftops and a courtyard from an upstairs window, on a worn metal plate." width={1000} height={841} side="right" offset={-6} caption="Nicéphore Niépce, View from the Window at Le Gras, 1827 (Harry Ransom Center)" note="The oldest surviving photograph, out of Niépce’s upstairs window. Its exposure is traditionally put at about eight hours, and one researcher who recreated his process thinks it took days. So, tap and drag is a pretty good deal." />
          <p>
            on an iphone, you get to choose. apple’s guide puts it simply: <a href={SRC.tools}>tap the screen</a> where you want
            the focus, then drag up or down next to it to make the photo brighter or darker. to keep that setting for the next
            few shots, touch and hold until you see AE/AF Lock (auto-exposure and auto-focus, locked).
          </p>
          <p>
            apple also says the camera uses face detection to balance the exposure across faces, so it’s often right without
            you doing anything. a bright sky right behind a face is the case where it’s worth checking.
          </p>
          <p>
            i didn’t find a study on tapping specifically. this one is just how sensors work: decide what you care about most,
            and let the rest go white or black.
          </p>
        </Section>

        <Section id="background" title="everything behind you">
          <PhotoSlot
            name="bali-pool-dusk.jpg"
            ratio={[3, 2]}
            alt="Me standing centred at the edge of an infinity pool at dusk, with a pink and blue cloudy sky over the ocean, a building and a crowd on the right, and a lounger cut off at the right edge."
          >
            Bali at dusk. Lovely light, busy right side.
          </PhotoSlot>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            this is one of my favourite photos of me, and the light is the reason. it was dusk, the sky was pink and blue over
            the ocean, and the light on me is soft and even. but look at the right side: a building, a crowd of people, and half
            a lounger poking in from the edge.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p>
            that’s the clutter from the snapshot study. your eye keeps getting pulled to the edges, away from the person the
            photo is about. there are three ways out: move so the busy part leaves the frame, crop it out later, or blur it.
          </p>
          <p>
            how much a background blurs comes down to distances. the formula for the size of the blur on a background detail
            depends on the lens’s opening, how big your subject is in the frame, and how far the background is behind them{" "}
            <a href={SRC.dof}>compared with how far it is from you</a>. a phone’s lens is tiny, so you don’t get much blur to
            begin with, but you can still move it a lot.
          </p>
          <Blur />
          <p>
            with the wall right behind her, it stays sharp, whatever you do. move her away from the wall, or walk closer to her,
            and the background starts to melt.
          </p>
          <p>
            portrait mode does this in software instead: apple says it{" "}
            <a href={SRC.portrait}>creates a depth-of-field effect</a>, and you can turn the blur up or down afterwards with
            depth control. it’s handy, but it’s software, so check edges like hair. and it still can’t remove the crowd.
          </p>
        </Section>

        <Section id="lens" title="0.5x, 1x, 2x">
          <PhotoSlot
            name="gym-selfie.jpg"
            ratio={[3, 4]}
            narrow
            alt="A close front-camera selfie of me looking puzzled in a school gym, with a blue cinder-block wall, an orange door and an orange floor."
          >
            The front camera, very close.
          </PhotoSlot>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            and then there’s this one. a very close selfie, puzzled face, gym wall behind me. i like it as a funny photo, but it
            doesn’t look like me. my nose is bigger, my face is longer, and my ears have basically disappeared.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p>
            this has the best evidence of anything in this post. and plot twist: it isn’t really the lens doing it, it’s the
            distance. when a camera is close, the parts of your face nearer to it (your nose) come out much bigger than the
            parts further back (your cheeks and ears).
          </p>
          <Picture src="/iphone-photos/durer-lute.png" alt="A 1525 woodcut: two men at a table. One holds a pointer on a lute; a string runs from the lute through an upright wooden frame to a fixed point on the wall, and the other man marks where the string crosses the frame." width={998} height={710} side="right" offset={-6} caption="Albrecht Dürer, Man Drawing a Lute, 1525" note="Perspective is just geometry, and people have known it for a while. Here the string plays the eye: it runs from one fixed point on the wall to the lute, and they mark where it passes through the frame. Move that point closer and the whole picture changes." />
          <p>
            in 2018, brittany ward and her colleagues worked out the geometry and found that a selfie from about 12 inches away
            makes the nose look <a href={SRC.ward}>about 30% wider</a> next to the cheekbones, while at 5 feet there’s
            essentially no difference.
          </p>
          <p>
            and it isn’t just looks. in a set of experiments in 2012, people rated faces photographed from up close as{" "}
            <a href={SRC.bryan}>less trustworthy, less competent and less attractive</a> than the same faces photographed from
            further away, and they invested less money with them in a trust game. same people, same expression, same light.
            only the camera’s distance changed. which is kind of wild?
          </p>
          <Distance />
          <p>
            so the lens matters because of where it makes you stand. your iphone’s buttons switch between{" "}
            <a href={SRC.basics}>0.5x, 1x, 2x</a> and more, depending on the model. on an iphone 17 those are{" "}
            <a href={SRC.specs}>13, 26 and 52 mm</a> lenses (in the usual 35 mm terms). so to fit someone’s head and
            shoulders, the 0.5x puts you right up in their face, and the 2x puts you twice as far back as the 1x.
          </p>
          <p>
            the takeaway: for portraits of people, use 2x and step back. for selfies, hold the phone as far away as you can, or
            prop it up and use the timer.
          </p>
          <PhotoSlot
            name="monkey.jpg"
            ratio={[4, 3]}
            alt="A wide-angle selfie of me crouched on the left making a surprised face, with a macaque right up close in the foreground, a person walking behind me, and bright dappled sun through tall trees."
          >
            The same effect, used on purpose.
          </PhotoSlot>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            the same effect can be great, though. in this one the wide lens makes the monkey right next to the camera look
            enormous, and me a little further back look small and alarmed, which is exactly how it felt. something big and
            close in front, something smaller behind it: that’s what gives a photo depth. it just shouldn’t be your nose.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="night" title="night">
          <PhotoSlot
            name="nyc-rooftop-night.jpg"
            ratio={[2, 3]}
            narrow
            alt="A full-length photo of me at night on a rooftop, leaning on a grey wooden wall and looking at my phone, with the lit MetLife clock tower and the Empire State Building behind me, and red cables on the floor on the left."
          >
            A rooftop in New York.
          </PhotoSlot>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            this was on a rooftop in new york, with the clock tower and the empire state building lit up behind me. the
            buildings look great. i look like i was lit by a flash, flat and a bit too bright against the dark, and there are
            red cables on the floor on the left that i didn’t notice until much later.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p>
            at night, the iphone’s night mode does a lot of the work. according to apple, it{" "}
            <a href={SRC.night}>turns on by itself</a> when it’s dark enough (the night mode icon goes yellow), and the photo
            can take a few seconds, so hold still, or rest the phone on something solid. if crosshairs show up, line them up:
            the phone has noticed you moving.
          </p>
          <Picture src="/iphone-photos/cornelius-1839.webp" alt="An 1839 daguerreotype self-portrait of Robert Cornelius: a young man with messy hair and crossed arms, slightly off-centre, looking just past the camera." width={700} height={888} side="right" offset={-6} caption="Robert Cornelius, self-portrait, 1839" note="One of the earliest photos of a person ever taken, and a self-portrait. Cornelius had to hold still for 10 to 15 minutes. Night mode asks you for a few seconds." />
          <p>
            one thing i didn’t know: turning on the flash, or live photos, switches night mode off. so if you want the city
            lights behind you to glow, the flash is working against you.
          </p>
          <p>
            and the cables are the same lesson as bali. before you tap the shutter, take one second to look at the edges of the
            frame.
          </p>
        </Section>

        <Section id="matters" title="the cheat sheet">
          <p>ranked by how much difference it makes and how good the evidence is:</p>
          <ol className="grid list-decimal gap-y-1 pl-[3ch]">
            <li>
              <span className="text-ink">don’t take faces from up close.</span> step back and use 2x. the strongest evidence
              here: the geometry (ward et al.) and experiments showing close-up faces are judged worse (bryan et al.).
            </li>
            <li>
              <span className="text-ink">look at the light before anything else.</span> side light shows shape, big soft light
              is kind, midday sun from above is hard on faces, and light from below looks wrong. mostly geometry, plus one study
              on light from below.
            </li>
            <li>
              <span className="text-ink">make it obvious what the photo is of.</span> get closer, change your angle, or move the
              person away from the background. simplicity is what people named first when asked what separates professional
              photos from snapshots.
            </li>
            <li>
              <span className="text-ink">tap the face.</span> when there’s a bright sky behind someone, tap them and drag the
              brightness. no study, just how sensors work, and apple’s own advice.
            </li>
            <li>
              <span className="text-ink">centre them, or let them look into the frame.</span> the rule of thirds is fine but
              weaker than its reputation. the research favours the centre for faces looking at you.
            </li>
            <li>
              <span className="text-ink">styles, filters and fancy grids, last.</span> photographic styles{" "}
              <a href={SRC.styles}>adjust specific colours</a> in different parts of a photo, and on newer iphones you can
              change them afterwards in photos. they change the look, but i didn’t find anything saying they make a photo
              better.
            </li>
          </ol>
        </Section>

        <Section id="next" title="next trip">
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            next trip, i want to try all of this on purpose. 2x and a few steps back. a quick look at where the light is before
            i hand someone my phone. tap my face. and maybe go back to milan in the late afternoon instead of at noon.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="notes" title="notes">
          <p className="text-muted">
            Method: the drawings are small models, not photos. The head is a ray-marched shape lit by one light; the face is
            Ward et al.’s layers, with rough depths for an average face; the blur follows the thin-lens formula, relative to itself;
            the exposure demo is a toy meter. No images in this post are AI-generated; the photos are mine, and the three old pictures (Niépce, Dürer, Cornelius) are public domain, via Wikimedia Commons. Code: <a href={CODE}>github.com/Arya-P05/green-wave</a>.
          </p>
          <ol className="grid gap-y-1 text-muted">
            <li>
              Palmer, S. E., Gardner, J. S. &amp; Wickens, T. D. (2008).{" "}
              <a href={SRC.palmer}>Aesthetic issues in spatial composition: effects of position and direction on framing single objects</a>.
              Spatial Vision.
            </li>
            <li>
              Amirshahi, S. A., Hayn-Leichsenring, G. U., Denzler, J. &amp; Redies, C. (2014).{" "}
              <a href={SRC.amirshahi}>Evaluating the rule of thirds in photographs and paintings</a>. Art &amp; Perception.
            </li>
            <li>
              Ke, Y., Tang, X. &amp; Jing, F. (2006). <a href={SRC.ke}>The design of high-level features for photo quality assessment</a>. CVPR.
            </li>
            <li>
              Johnston, A., Hill, H. &amp; Carman, N. (1992).{" "}
              <a href={SRC.johnston}>Recognising faces: effects of lighting direction, inversion, and brightness reversal</a>. Perception.
            </li>
            <li>
              Ward, B., Ward, M., Fried, O. &amp; Paskhover, B. (2018).{" "}
              <a href={SRC.ward}>Nasal distortion in short-distance photographs: the selfie effect</a>. JAMA Facial Plastic Surgery.
            </li>
            <li>
              Bryan, R., Perona, P. &amp; Adolphs, R. (2012).{" "}
              <a href={SRC.bryan}>Perspective distortion from interpersonal distance is an implicit visual cue for social judgments of faces</a>.
              PLoS ONE.
            </li>
            <li>
              Apple. iPhone User Guide: <a href={SRC.tools}>Use camera tools</a>, <a href={SRC.basics}>Camera basics</a>,{" "}
              <a href={SRC.styles}>Use Photographic Styles</a>. Apple Support: <a href={SRC.night}>Use Night mode</a>,{" "}
              <a href={SRC.portrait}>Use Portrait mode</a>. <a href={SRC.specs}>iPhone 17 technical specifications</a>.
            </li>
            <li>
              Wikipedia. <a href={SRC.dof}>Depth of field: foreground and background blur</a>.
            </li>
          </ol>
        </Section>

        <Meta rows={META} />
        <SignOff />
      </article>
    </main>
  );
}
