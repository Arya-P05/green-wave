import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { Review } from "@/components/shared/Review";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aryap.me"),
  title: { default: "writing · Arya Patel", template: "%s · Arya Patel" },
  description: "Questions I got curious about, worked out with small simulations you can play with.",
};

export const viewport: Viewport = {
  themeColor: "#f5ecdc",
};

const VT_SCRIPT = `(function(){
function sfTheme(){
try{
var parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',hour:'numeric',hourCycle:'h23'}).formatToParts(new Date());
var h=12;
for(var i=0;i<parts.length;i++){if(parts[i].type==='hour'){h=parseInt(parts[i].value,10);break;}}
return (h<6||h>=19)?'night':'day';
}catch(e){
var d=new Date().getHours();
return (d<6||d>=19)?'night':'day';
}
}
function getTheme(){
try{
var t=sessionStorage.getItem('arya-vt-theme');
if(t==='day'||t==='night')return t;
}catch(e){}
return sfTheme();
}
function fromPath(){
try{
var u=window.navigation&&window.navigation.activation&&window.navigation.activation.from&&window.navigation.activation.from.url;
if(u){var p=new URL(u);if(p.origin===location.origin)return p.pathname;}
}catch(e){}
if(document.referrer){
try{var r=new URL(document.referrer);if(r.origin===location.origin)return r.pathname;}catch(e){}
}
return '';
}
window.addEventListener('pagereveal',function(e){
if(!e.viewTransition)return;
if(e.hasUAVisualTransition){e.viewTransition.skipTransition();return;}
document.documentElement.dataset.vtArrived='1';
if(fromPath()==='/'&&e.viewTransition.types){
var t=getTheme();
e.viewTransition.types.add('to-writing');
e.viewTransition.types.add(t==='night'?'from-night':'from-day');
}
});
window.addEventListener('pageswap',function(e){
if(!e.viewTransition)return;
var destUrl=e.activation&&e.activation.entry&&e.activation.entry.url;
if(!destUrl)return;
try{
var d=new URL(destUrl);
if(d.origin!==location.origin||d.pathname!=='/')return;
}catch(err){return;}
if(e.viewTransition.types){
var t=getTheme();
e.viewTransition.types.add('from-writing');
e.viewTransition.types.add(t==='night'?'to-night':'to-day');
}
});
})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={plexMono.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: VT_SCRIPT }} />
      </head>
      <body>
        {children}
        {process.env.NODE_ENV === "development" && <Review />}
      </body>
    </html>
  );
}
