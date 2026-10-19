// Optional authoring tool. Sharp is loaded from an explicit tools folder,
// outside the app. No npm dependency is added to TempoFold.
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const here=path.dirname(fileURLToPath(import.meta.url));
const toolsDirectory=process.argv[2];
if(!toolsDirectory)throw new Error('Usage: node render.mjs /absolute/path/to/tools-with-node_modules');
const require=createRequire(path.resolve(toolsDirectory,'package.json'));
const sharp=require('sharp');
const panels=process.argv[3]==='--contact-only'
 ?{'contact-sheet':{output:'contact-sheet.jpg',size:[1800,1710]}}
 :JSON.parse(await readFile(path.join(here,'panels.json'),'utf8'));
for(const [key,panel] of Object.entries(panels)){
 const output=path.resolve(here,'..',panel.output);await mkdir(path.dirname(output),{recursive:true});
 await sharp(await readFile(path.join(here,`${key}.svg`))).jpeg({quality:95,chromaSubsampling:'4:4:4'}).toFile(output);
 const meta=await sharp(output).metadata();
 if(meta.width!==panel.size[0]||meta.height!==panel.size[1])throw new Error(`Incorrect dimensions: ${output}`);
 console.log(`${key}: ${meta.width} × ${meta.height}`);
}
