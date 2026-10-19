"""Create portable SVG compositions from original vector type and actual UI captures.

Optional authoring dependency: fonttools. Run from any directory with a Python
that has fonttools, then render the generated SVGs with render.mjs and Sharp.
The app itself does not load this script or need either package.
"""
from pathlib import Path
import base64, html, json
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen

ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'marketplace/source'
FONT=ROOT/'assets/fonts/HankenGrotesk.ttf'
INK='#182c47'; OCEAN='#405b68'; LIME='#dcecc0'; WHITE='#ffffff'
FONTS={w:instantiateVariableFont(TTFont(FONT),{'wght':w},inplace=False) for w in [500,600,750]}
DIMS={'agenda-detail.jpg':(836,579),'protected-detail.jpg':(836,177),'editor.jpg':(650,745),'recovery.jpg':(650,592),'timer.jpg':(350,801),'print.jpg':(1280,900)}
PANELS={
 'cover':{'size':[1600,900],'output':'images/01-cover.jpg','label':'01 · Listing hero','alt':'TempoFold workshop planner, actual synthetic agenda and live overtime timer.'},
 'planning':{'size':[1600,900],'output':'images/03-planning.jpg','label':'02 · Plan and protect','alt':'Actual editor showing duration, minimum, protected setting and facilitator notes.'},
 'recovery':{'size':[1600,900],'output':'images/02-recovery.jpg','label':'03 · Exact recovery','alt':'Actual seven-minute recovery preview, with five minutes and two minutes reclaimed from future flexible blocks.'},
 'timer':{'size':[1600,900],'output':'images/04-timer.jpg','label':'04 · Live timer','alt':'Actual overtime timer with manual advance and a detail of target and projected finish.'},
 'print':{'size':[1600,900],'output':'images/05-run-sheet.jpg','label':'05 · Printable run sheet','alt':'Actual print-layout detail with planning times, facilitator notes and minimums.'},
 'protected':{'size':[1600,900],'output':'promo/06-protected.jpg','label':'Extra · Protected closing','alt':'Actual protected ten-minute Commit and close block in a synthetic workshop.'},
 'square':{'size':[1080,1080],'output':'social/tempofold-square-1080.jpg','label':'Social · Square 1080 × 1080','alt':'Square TempoFold promotion with actual recovery table and synthetic seven-minute example.'},
 'landscape':{'size':[1200,630],'output':'social/tempofold-landscape-1200x630.jpg','label':'Social · Landscape 1200 × 630','alt':'Landscape TempoFold promotion showing exact recovery cuts in the actual app.'},
 'portrait':{'size':[1080,1350],'output':'social/tempofold-portrait-1080x1350.jpg','label':'Social · Portrait 1080 × 1350','alt':'Portrait TempoFold promotion with a large actual recovery preview and clearly identified synthetic example.'}
}

def uri(path):
    mime='image/svg+xml' if path.suffix=='.svg' else 'image/jpeg'
    return 'data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode()

class Canvas:
    def __init__(self,w,h,title,bg=WHITE):
        self.w=w;self.h=h;self.title=title;self.parts=[];self.defs=[];self.used={};self.count=0
        self.rect(0,0,w,h,bg)
    def rect(self,x,y,w,h,fill,rx=0,stroke=None):
        self.parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}"'+(f' stroke="{stroke}"' if stroke else '')+'/>')
    def line(self,x1,y1,x2,y2,color):
        self.parts.append(f'<path d="M{x1} {y1}H{x2}" stroke="{color}" stroke-width="2"/>')
    def measure(self,value,size,weight=500,tracking=0):
        f=FONTS[weight];cmap=f.getBestCmap();upem=f['head'].unitsPerEm
        return sum(f['hmtx'].metrics[cmap.get(ord(c),'space')][0]*size/upem+tracking for c in value)-tracking
    def text(self,value,x,y,size,weight=500,color=INK,tracking=0):
        f=FONTS[weight];cmap=f.getBestCmap();glyphs=f.getGlyphSet();scale=size/f['head'].unitsPerEm;cursor=0;uses=[]
        for char in value:
            name=cmap.get(ord(char),'space');key=(weight,name)
            if key not in self.used:
                ident=f'g{weight}_{len(self.used)}';pen=SVGPathPen(glyphs);glyphs[name].draw(pen)
                self.used[key]=ident;self.defs.append(f'<path id="{ident}" d="{pen.getCommands()}"/>')
            uses.append(f'<use href="#{self.used[key]}" x="{cursor:.3f}"/>')
            cursor+=f['hmtx'].metrics[name][0]+tracking/scale
        self.parts.append(f'<g aria-label="{html.escape(value,quote=True)}" fill="{color}" transform="translate({x} {y}) scale({scale:.6f} {-scale:.6f})">'+''.join(uses)+'</g>')
    def lines(self,lines,x,top,size=96,weight=750,color=INK,gap=None,width=None,tracking=-2.5):
        if width:
            size=min(size,min(size*width/max(self.measure(s,size,weight,tracking),1) for s in lines))
        gap=gap or size*1.03
        for i,s in enumerate(lines):self.text(s,x,top+size*.76+i*gap,size,weight,color,tracking)
        return size
    def logo(self,x=60,y=42,w=222,dark=False):
        path=ROOT/'brand'/('wordmark-reversed.svg' if dark else 'wordmark.svg')
        self.parts.append(f'<image x="{x}" y="{y}" width="{w}" height="{w*64/305:.2f}" href="{uri(path)}"/>')
    def header(self,w=1600,dark=False,eyebrow='Workshop planner',social=False):
        self.logo(48 if social else 60,38 if social else 42,232 if social else 222,dark)
        size=25 if social else 27
        tw=self.measure(eyebrow,size,600)
        self.text(eyebrow,w-(48 if social else 60)-tw,70 if social else 78,size,600,LIME if dark else INK)
    def footer(self,dark=False,w=None,h=None,social=False,stack=False,hero=False):
        w=w or self.w;h=h or self.h;x=48 if social else 60;small=20 if social else 21
        color='#d9e3eb' if dark else OCEAN
        if stack:
            self.text('Actual app screens · Synthetic examples',x,h-78,small,500,color)
            self.text('aryarashid.github.io/tempofold',x,h-34,30 if h>1100 else 28,600,WHITE if dark else INK)
        else:
            self.text('Actual app screens · Synthetic examples',x,h-38,small,500,color)
            url='aryarashid.github.io/tempofold';size=22 if w<1300 else 24
            self.text(url,w-x-self.measure(url,size,600),h-38,size,600,INK if hero else color)
    def screen(self,file,x,y,w,h,image_width=None,source_y=0,rotate=0,border=1,rx=16):
        self.count+=1;ident=f'clip{self.count}';iw=image_width or w;sw,sh=DIMS[file];scale=iw/sw
        innerw=w-border*2;innerh=h-border*2
        self.defs.append(f'<clipPath id="{ident}"><rect x="{x+border}" y="{y+border}" width="{innerw}" height="{innerh}" rx="{max(0,rx-border)}"/></clipPath>')
        self.parts.append(f'<g transform="rotate({rotate} {x+w/2} {y+h/2})">')
        self.rect(x+2,y+13,w,h,'#182c4714',rx)
        self.rect(x,y,w,h,WHITE,rx,'#b7c7d1')
        self.parts.append(f'<image x="{x+border}" y="{y+border-source_y*scale}" width="{iw}" height="{sh*scale}" href="{uri(ROOT/"marketplace/source-captures"/file)}" clip-path="url(#{ident})"/>')
        self.parts.append('</g>')
    def save(self,path,description):
        svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}" role="img" aria-labelledby="title desc"><title id="title">{html.escape(self.title)}</title><desc id="desc">{html.escape(description)} Actual screenshots with synthetic examples; no customer results are claimed. Original artwork MIT; Hanken Grotesk outlined lettering retains SIL OFL 1.1.</desc><defs>'+''.join(self.defs)+'</defs>'+''.join(self.parts)+'</svg>\n'
        path.write_text(svg)

for key,p in PANELS.items():
 w,h=p['size'];bg={'cover':INK,'planning':'#f1f6e9','recovery':'#ece6f5','timer':'#dceaf0','print':'#f5efe5','protected':INK,'square':LIME,'landscape':INK,'portrait':INK}[key]
 c=Canvas(w,h,'TempoFold · '+p['label'],bg)
 if key=='cover':
  c.parts.append('<path d="M1220 0H1600V900H970Z" fill="#dcecc0"/>')
  c.header(dark=True);c.rect(1265,33,280,56,LIME,28);c.text('Workshop planner',1290,71,26,600)
  c.lines(['Run the room.','Keep time','in view.'],64,190,105,color=WHITE,width=580)
  c.lines(['Plan your workshop. Preview','exact cuts when it runs late.'],64,553,40,500,'#e1e8ed',gap=50,tracking=0)
  c.line(64,663,575,663,'#627388');c.text('No account. Free MIT source.',64,712,29,600,LIME)
  c.screen('agenda-detail.jpg',696,164,850,600,rotate=-3)
  c.screen('timer.jpg',1130,420,365,392,rotate=3,border=6)
  c.footer(True,hero=True)
 elif key=='planning':
  c.header();c.lines(['Plan the flow.','Protect','the ending.'],64,178,94,width=595)
  c.lines(['Set durations, minimums','and facilitator notes.'],64,510,40,500,OCEAN,gap=50,tracking=0)
  c.line(64,642,587,642,'#bccfd2');c.lines(['Your plan. Your limits.','No silent cuts.'],64,672,29,600,gap=40,tracking=0)
  c.text('Set the rules before the session.',720,177,27,600,OCEAN)
  c.screen('editor.jpg',716,205,820,500,source_y=263)
  c.text('15 min',735,793,43,750);c.text('planned',872,793,28,500,OCEAN)
  c.text('10 min',1110,793,43,750);c.text('minimum',1258,793,28,500,OCEAN);c.footer()
 elif key=='recovery':
  c.header();c.lines(['Seven minutes.','Every cut','visible.'],64,178,93,width=580)
  c.lines(['Only future flexible blocks.','Nothing below its minimum.'],64,510,40,500,OCEAN,gap=50,tracking=0)
  c.line(64,650,570,650,'#b9afd1');c.text('Preview → Apply → Undo',64,706,29,600)
  c.text('Actual recovery preview · Synthetic workshop',670,252,25,600,OCEAN)
  c.screen('recovery.jpg',660,289,884,250,source_y=240,rx=12)
  c.text('5 min',676,658,72,750,tracking=-2);c.text('+ 2 min',1100,658,72,750,tracking=-2)
  c.text('from Explore possibilities',676,704,25,500,OCEAN);c.text('from Take a breath',1100,704,25,500,OCEAN);c.footer()
 elif key=='timer':
  c.header();c.lines(['Overtime is','hard to miss.'],64,187,93,width=605)
  c.lines(['A live timer. A fixed target.','You choose when to move on.'],64,439,40,500,OCEAN,gap=50,tracking=0)
  c.line(64,577,611,577,'#afc8d1');c.lines(['Pause · Resume','Manual advance'],64,611,31,600,gap=43,tracking=0)
  c.screen('timer.jpg',770,154,600,550)
  c.screen('timer.jpg',720,690,490,150,source_y=383,rotate=-4,border=6)
  c.text('Target and projection stay explicit.',64,761,25,500,OCEAN);c.footer()
 elif key=='print':
  c.header();c.lines(['Bring the plan','into the room.'],64,200,95,width=607)
  c.lines(['Print a facilitator run sheet.','Export JSON for a backup.'],64,463,40,500,OCEAN,gap=50,tracking=0)
  c.line(64,602,620,602,'#cdbfae');c.lines(['Planning times. Notes.','Minimums.'],64,640,32,600,gap=43,tracking=0)
  c.text('Actual print layout · Detail',750,133,27,600,OCEAN)
  c.screen('print.jpg',730,162,790,628,image_width=1300,rotate=3,border=14,rx=5);c.footer()
 elif key=='protected':
  c.header(dark=True,eyebrow='Protected time');c.lines(['The closing keeps its ten minutes.'],64,175,91,color=WHITE,width=1470)
  c.lines(['Protected blocks keep their duration.','Recovery adjusts eligible future flexible blocks.'],64,320,42,500,'#d9e3eb',gap=54,tracking=0)
  c.screen('protected-detail.jpg',110,475,1380,293,border=12)
  c.text('Actual protected closing · Synthetic workshop',110,815,29,600,LIME);c.footer(True)
 elif key=='landscape':
  c.logo(44,30,184,True);c.text('Workshop planner',947,63,23,600,LIME)
  c.lines(['Running late? See what can flex.'],44,116,73,color=WHITE,width=1110)
  c.text('Review exact cuts. Protect important blocks. Try TempoFold free.',44,240,28,500,LIME)
  c.screen('recovery.jpg',44,280,1112,292,source_y=240,rx=12);c.footer(True)
 elif key=='square':
  c.header(w,dark=False,social=True);c.lines(['Your workshop.','Room to flex.'],48,153,94,width=984)
  c.lines(['Plan the flow. Protect the ending.','Preview every recovery cut.'],48,372,33,500,OCEAN,gap=43,tracking=0)
  c.text('Actual recovery preview',51,498,28,600,OCEAN)
  c.screen('recovery.jpg',48,535,984,281,source_y=240,rx=14)
  c.text('7 min requested. Two visible cuts.',48,918,40,600)
  c.footer(w=w,h=h,social=True,stack=True)
 elif key=='portrait':
  c.header(w,dark=True,social=True);c.lines(['Running late?','See what','can flex.'],48,178,110,color=WHITE,width=970)
  c.lines(['Seven minutes requested.','Two visible changes.'],48,568,38,500,LIME,gap=49,tracking=0)
  c.screen('recovery.jpg',48,701,984,255,source_y=250,rx=16)
  c.text('5 min + 2 min = 7 min',48,1085,71,750,LIME,tracking=-1)
  c.lines(['Protected blocks keep their time.','Every cut needs your approval.'],48,1138,36,600,LIME,gap=46,tracking=0)
  c.footer(True,w,h,True,True)
 c.save(SOURCE/f'{key}.svg',p['alt'])
(SOURCE/'panels.json').write_text(json.dumps(PANELS,ensure_ascii=False,indent=2)+'\n')
print('Created nine SVG compositions with embedded actual screenshots.')
