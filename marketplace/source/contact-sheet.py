"""Assemble a contact sheet from the finished, unaltered promotional JPEGs."""
from pathlib import Path
import runpy
ns=runpy.run_path(str(Path(__file__).with_name('generate.py')))
Canvas=ns['Canvas'];PANELS=ns['PANELS'];ROOT=ns['ROOT'];SOURCE=ns['SOURCE'];uri=ns['uri']
c=Canvas(1800,1710,'TempoFold promotional image contact sheet','#f1f4f4')
c.logo(50,40,260)
c.text('The product, ready to show.',50,161,59,750,tracking=-1.5)
c.text('5 listing images · 1 protected-block panel · 3 social formats',50,211,28,500,'#405b68')
for index,(key,panel) in enumerate(PANELS.items()):
 col=index%3;row=index//3;x=50+580*col;label_y=255+395*row
 c.text(panel['label'],x,label_y,25,600)
 w,h=panel['size'];scale=min(540/w,(540 if row==2 else 304)/h);iw=w*scale;ih=h*scale
 y=label_y+22+(0 if row<2 else (540-ih)/2)
 c.parts.append(f'<image x="{x+(540-iw)/2}" y="{y}" width="{iw}" height="{ih}" href="{uri(ROOT/"marketplace"/panel["output"])}"/>')
c.text('Actual app screens. Synthetic examples. No customer results claimed.',50,1660,26,500,'#405b68')
c.save(SOURCE/'contact-sheet.svg','An overview of all nine finished promotional images. Open individual images for full resolution.')
print('Created contact sheet SVG.')
