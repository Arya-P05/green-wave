import type { Metadata } from "next";
import Link from "next/link";
import Blur from "@/components/iphone-photos/Blur";
import Distance from "@/components/iphone-photos/Distance";
import Exposure from "@/components/iphone-photos/Exposure";
import Frame from "@/components/iphone-photos/Frame";
import Light from "@/components/iphone-photos/Light";
import PhotoSlot from "@/components/iphone-photos/PhotoSlot";
import Nerds from "@/components/shared/Nerds";
import { Meta, order, Section, SignOff } from "@/components/shared/Post";
import Toc from "@/components/shared/Toc";
import type { Entry } from "@/components/shared/Toc";

export const metadata: Metadata = {
  title: "almost good",
  description:
    "How do you take really good iPhone photos? The usual tips, checked against the research, with five small drawings to play with.",
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
  { id: "photo", title: "the photo" },
  { id: "frame", title: "where to stand" },
  { id: "light", title: "light" },
  { id: "exposure", title: "exposure" },
  { id: "background", title: "the background" },
  { id: "lens", title: "the lens" },
  { id: "night", title: "night" },
  { id: "matters", title: "what matters" },
  { id: "next", title: "next" },
  { id: "notes", title: "notes" },
];

const META: [string, React.ReactNode][] = [
  ["when", "November 2026"],
  ["tools", "TypeScript, Next.js, SVG and a small ray marcher on a canvas, no libraries"],
  ["data", "published studies and Apple’s own guides (sources in the notes); the photos are mine"],
  ["code", <a key="code" href={CODE}>github.com/Arya-P05/green-wave</a>],
];

export default function IphonePhotos() {
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
              almost good
            </h1>
            <p className="arrive text-muted" style={order(2)}>
              How do you take really good iPhone photos?
            </p>
          </div>
          {/* <!-- ARYA-TWEAK --> */}
          <p className="arrive" style={order(3)}>
            I take a lot of photos on trips, almost all of them on my phone, and most of them are almost good. The place was
            beautiful, the moment was fun, and the photo is… fine. So I went looking for what actually makes a phone photo
            better, and for which of the usual tips have real evidence behind them.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p className="arrive" style={order(4)}>
            Some do. Some, like the rule of thirds, have a lot less than I thought. Along the way there are five small drawings
            you can play with, and a few of my own photos, flaws included.
          </p>
        </header>

        <nav aria-label="contents" className="mt-2 md:hidden">
          <Toc entries={SECTIONS} />
        </nav>

        <Section id="photo" title="the photo">
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
            This is me in front of the Milan Cathedral. I’d wanted to see it for years, and it did not disappoint. The photo
            has a deep blue sky and the whole cathedral in it, and then there’s me: a small person in the middle, squinting, with
            a hard black shadow next to me and tourists all around.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p>
            Nothing in it is broken. The phone did its job. But it has most of the problems this post is about: where I am in
            the frame, what the light is doing to my face, and how much else is going on around me. So let’s take them one at a
            time, starting with the one everyone has heard of.
          </p>
        </Section>

        <Section id="frame" title="where to stand">
          <p>
            The rule of thirds says to split the frame into a three-by-three grid and put your subject on one of the lines,
            not in the middle. Your iPhone will even <a href={SRC.tools}>draw the grid</a> for you (Settings, Camera, Grid). It’s in nearly every photography guide, so I
            expected it to have plenty of research behind it.
          </p>
          <p>
            <span className="text-ink">It mostly doesn’t.</span> In 2008, Stephen Palmer and his colleagues at Berkeley showed
            people pictures of a single thing (a person, a car, a teapot) at different spots in a frame, and asked which they
            liked better. For something facing the viewer, people liked it <a href={SRC.palmer}>in the centre</a>, and liked it
            less the further it moved out. For something facing sideways, they liked it a little off-centre, but only on the side
            that left it looking <i>into</i> the frame. Facing out of the frame, with its back to the empty space, was disliked
            even on a third line. The peaks were around 42% and 58% of the way across, not at the third lines, and the authors
            summed up their results as consistent with the rule of thirds “at best, one-third of the time.”
          </p>
          <p>
            A 2014 study came at it from the other direction. People rated photos, and the researchers measured how closely each
            photo followed the rule. The link with how much people liked a photo was <a href={SRC.amirshahi}>weak</a>, and the
            most highly rated photos (and a large set of paintings) followed the rule about as little as photos that ignored it.
            Their words: it plays “only a minor, if any, role.”
          </p>
          <Frame />
          <p>
            What does seem to matter is that it’s obvious what you’re meant to look at. When researchers asked photographers
            and non-photographers what separates professional photos from snapshots, the main answer was{" "}
            <a href={SRC.ke}>simplicity</a>: the subject is easy to pick out from the background. When they measured photos, the
            professional ones had their detail gathered toward the middle, and the snapshots had busy clutter all the way out to
            the edges.
          </p>
          <p>
            So in the Milan photo, being in the middle was fine. Facing the camera, the middle is where people like you. The
            problem is how small I am. The cathedral wins, and I look like I wandered into someone else’s picture. Either step
            closer so I’m clearly the subject, or let the cathedral be the photo on purpose.
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

        <Section id="light" title="light">
          <p>
            The same Milan photo has a second problem, and it’s a bigger one. It was midday, so the sun was almost straight
            above me. Light from the top fills your eye sockets with shadow, puts a dark patch under your nose and chin, and makes
            you squint.
          </p>
          <p>
            Two things decide what light does to a face: <span className="text-ink">where it comes from</span>, and{" "}
            <span className="text-ink">how big it is</span> compared with you. The second one is just geometry, not a study. The
            sun is a tiny dot in the sky, so it makes shadows with sharp edges. A window or a cloudy sky is huge, so every part of
            your face gets light from lots of angles at once, and the edges of the shadows go soft.
          </p>
          <Light />
          <p>
            The one part of this with real research behind it is light from below. Our eyes assume light comes from above, and
            a 1992 study concluded that lighting a face <a href={SRC.johnston}>from below</a> disrupts how we build up its 3D
            shape. That’s probably why the torch-under-the-chin face looks so wrong.
          </p>
          <p>
            It’s also part of why golden hour works. When the sun is low, it comes from the side instead of the top, so you get
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
            This one is backlight done mostly right. The sun is right behind my head, so there’s a warm glow around my hair and
            the whole thing feels soft. Because my eyes are closed, I’m not squinting into anything. The catch is my face: it’s
            in its own shadow, so it comes out a bit flat. Which brings us to exposure.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="exposure" title="exposure">
          <p>
            A camera has to decide how bright to make the photo. It measures the light, then picks a brightness that makes
            whatever it measured come out a middle grey. The trouble is that a sensor can only hold so much range. When a face is
            in shade in front of a bright sky, the camera can’t keep both. Something turns pure white, or pure black.
          </p>
          <Exposure />
          <p>
            On an iPhone you get to choose. Apple’s guide puts it simply: <a href={SRC.tools}>tap the screen</a> where you want
            the focus, then drag up or down next to it to make the photo brighter or darker. To keep that setting for the next
            few shots, touch and hold until you see AE/AF Lock (auto-exposure and auto-focus, locked). Apple also says the camera
            uses face detection to balance the exposure across faces, so it’s often right without you doing anything. A bright
            sky right behind a face is the case where it’s worth checking.
          </p>
          <p>
            There’s no study I found on tapping specifically. This one is just how sensors work: decide what you care about
            most, and let the rest go white or black.
          </p>
        </Section>

        <Section id="background" title="the background">
          <PhotoSlot
            name="bali-pool-dusk.jpg"
            ratio={[3, 2]}
            alt="Me standing centred at the edge of an infinity pool at dusk, with a pink and blue cloudy sky over the ocean, a building and a crowd on the right, and a lounger cut off at the right edge."
          >
            Bali at dusk. Lovely light, busy right side.
          </PhotoSlot>
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            This is one of my favourite photos of me, and the light is the reason. It was dusk, the sky was pink and blue over
            the ocean, and the light on me is soft and even. But look at the right side: a building, a crowd of people, and half a
            lounger poking in from the edge.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p>
            That’s the clutter from the snapshot study. Your eye keeps getting pulled to the edges, away from the person the photo
            is about. There are three ways out: change where you stand so the busy part leaves the frame, crop it out later, or
            blur it.
          </p>
          <p>
            How much a background blurs comes down to distances. The formula for the size of the blur on a background detail
            depends on the lens’s opening, how big your subject is in the frame, and how far the background is behind them{" "}
            <a href={SRC.dof}>compared with how far it is from you</a>. A phone’s lens is tiny, so you don’t get much blur to begin
            with, but you can still move it a lot.
          </p>
          <Blur />
          <p>
            With the wall right behind her, it stays sharp, whatever you do. Move her away from the wall, or walk closer to her,
            and the background starts to melt. Portrait mode does this in software instead: Apple says it{" "}
            <a href={SRC.portrait}>creates a depth-of-field effect</a>, and you can turn the blur up or down afterwards with Depth
            Control. It’s handy, but it’s software, so check edges like hair, and it still can’t remove the crowd.
          </p>
        </Section>

        <Section id="lens" title="the lens">
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
            And then there’s this one. A very close selfie, puzzled face, gym wall behind me. I like it as a funny photo, but it
            doesn’t look like me. My nose is bigger, my face is longer, and my ears have basically disappeared.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p>
            This has the best evidence of anything in this post. It isn’t really the lens doing it, it’s the distance. When a
            camera is close, the parts of your face nearer to it (your nose) come out much bigger than the parts further back
            (your cheeks and ears). In 2018, Brittany Ward and her colleagues worked out the geometry and found that a selfie from
            about 12 inches away makes the nose look <a href={SRC.ward}>about 30% wider</a> next to the cheekbones, while at 5 feet
            there’s essentially no difference.
          </p>
          <p>
            And it isn’t just looks. In a set of experiments in 2012, people rated faces photographed from up close as{" "}
            <a href={SRC.bryan}>less trustworthy, less competent and less attractive</a> than the same faces photographed from
            further away, and they invested less money with them in a trust game. Same people, same expression, same light. Only
            the camera’s distance changed.
          </p>
          <Distance />
          <p>
            The lens matters because of where it makes you stand. Your iPhone’s buttons switch between{" "}
            <a href={SRC.basics}>0.5x, 1x, 2x</a> and more, depending on the model. On an iPhone 17 those are{" "}
            <a href={SRC.specs}>13, 26 and 52 mm</a> lenses (in the usual 35 mm terms), so to fit someone’s head and shoulders, the
            0.5x puts you right up in their face and the 2x puts you twice as far back as the 1x. For portraits of people, use 2x
            and step back. For selfies, hold the phone as far away as you can, or prop it up and use the timer.
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
            The same effect can be great, though. In this one the wide lens makes the monkey right next to the camera look
            enormous, and me a little further back look small and alarmed, which is exactly how it felt. Something big and close
            in front, something smaller behind it: that’s what gives a photo depth. It just shouldn’t be your nose.
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
            This was on a rooftop in New York, with the clock tower and the Empire State Building lit up behind me. The buildings
            look great. I look like I was lit by a flash, flat and a bit too bright against the dark, and there are red cables
            on the floor on the left that I didn’t notice until much later.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
          <p>
            At night, the iPhone’s Night mode does a lot of the work. According to Apple, it{" "}
            <a href={SRC.night}>turns on by itself</a> when it’s dark enough (the Night mode icon goes yellow), and the photo can take a
            few seconds, so hold still, or rest the phone on something solid. If crosshairs show up, line them up: the phone has
            noticed you moving. One thing I didn’t know: turning on the flash, or Live Photos, switches Night mode off. So if you
            want the city lights behind you to glow, the flash works against you.
          </p>
          <p>
            And the cables are the same lesson as Bali. Before you tap the shutter, take one second to look at the edges of the
            frame.
          </p>
        </Section>

        <Section id="matters" title="what matters">
          <p>Ranked by how much difference it makes and how good the evidence is:</p>
          <ol className="grid list-decimal gap-y-1 pl-[3ch]">
            <li>
              <span className="text-ink">Don’t take faces from up close.</span> Step back and use 2x. The strongest evidence here:
              the geometry (Ward et al.) and experiments showing close-up faces are judged worse (Bryan et al.).
            </li>
            <li>
              <span className="text-ink">Look at the light before anything else.</span> Side light shows shape, big soft light is
              kind, midday sun from above is hard on faces, and light from below looks wrong. Mostly geometry, plus one study on
              light from below.
            </li>
            <li>
              <span className="text-ink">Make it obvious what the photo is of.</span> Get closer, change your angle, or move the
              person away from the background. Simplicity is what people named first when asked what separates professional
              photos from snapshots.
            </li>
            <li>
              <span className="text-ink">Tap the face.</span> When there’s a bright sky behind someone, tap them and drag the
              brightness. No study, just how sensors work, and Apple’s own advice.
            </li>
            <li>
              <span className="text-ink">Centre them, or let them look into the frame.</span> The rule of thirds is fine but
              weaker than its reputation. The research favours the centre for faces looking at you.
            </li>
            <li>
              <span className="text-ink">Styles, filters and fancy grids, last.</span> Photographic Styles{" "}
              <a href={SRC.styles}>adjust specific colours</a> in different parts of a photo, and on newer iPhones you can change
              them afterwards in Photos. They change the look, but I didn’t find anything saying they make a photo better.
            </li>
          </ol>
        </Section>

        <Section id="next" title="next">
          {/* <!-- ARYA-TWEAK --> */}
          <p>
            Next trip, I want to try all of this on purpose. 2x and a few steps back. A quick look at where the light is before I
            hand someone my phone. Tap my face. And maybe go back to Milan in the late afternoon instead of at noon.
          </p>
          {/* <!-- /ARYA-TWEAK --> */}
        </Section>

        <Section id="notes" title="notes">
          <p className="text-muted">
            Method: the drawings are small models, not photos. The head is a ray-marched shape lit by one light; the face is
            Ward et al.’s layers, with rough depths for an average face; the blur follows the thin-lens formula, relative to itself;
            the exposure demo is a toy meter. No images in this post are AI-generated; the photos are mine. Code: <a href={CODE}>github.com/Arya-P05/green-wave</a>.
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
