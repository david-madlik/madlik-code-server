import { chromium } from '../lib/vscode/node_modules/playwright/index.mjs';
import { expect } from '../lib/vscode/node_modules/@playwright/test/index.mjs';
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const cache=path.resolve('.madlik');
await mkdir(cache,{recursive:true});
const fixture=path.join(cache,'mouse-input.py');
await writeFile(fixture,`import sys,os,tty,termios,select,time\nfd=sys.stdin.fileno()\nprevious=termios.tcgetattr(fd)\ntry:\n tty.setraw(fd)\n sys.stdout.write('\\x1b[?1000h\\x1b[?'+sys.argv[1]+'h');sys.stdout.flush()\n open(sys.argv[2]+'.ready','w').close()\n with open(sys.argv[2]+'.bin','wb') as out:\n  deadline=time.monotonic()+15\n  while time.monotonic()<deadline and not os.path.exists(sys.argv[2]+'.stop'):\n   if select.select([fd],[],[],0.1)[0]:\n    out.write(os.read(fd,65536));out.flush()\nfinally:\n sys.stdout.write('\\x1b[?1000l\\x1b[?1006l\\x1b[?1016l');sys.stdout.flush()\n termios.tcsetattr(fd,termios.TCSADRAIN,previous)\n open(sys.argv[2]+'.done','w').close()\n`);
const browser=await chromium.launch({headless:true});
const results=[];
let page;
try {
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 page=await context.newPage();
 await page.goto('http://127.0.0.1:18110/?folder='+encodeURIComponent(path.join(cache,'workspace')));
 await page.locator('.madlik-mobile-navigation').waitFor({timeout:60000});
 await page.locator('[data-section="terminal"]').click();
 const terminal=page.locator('.terminal-wrapper.active:visible .xterm-helper-textarea').first();
 await terminal.waitFor({state:'attached',timeout:20000});
 const keyboard=page.locator('[data-action="keyboard"]');if(await page.locator('[data-action="keyboard-provider"]').getAttribute('aria-checked')==='false'){await page.locator('[data-action="keyboard-provider"]').click();}
 const screen=page.locator('.terminal-wrapper.active:visible .xterm-screen').first();
 for(const encoding of ['1006','1016']) {
  const prefix=path.join(cache,`mouse-${encoding}-${Date.now()}`);
  await terminal.focus(); // Remember input while browsing.
  await keyboard.click();
  await expect(terminal).toBeFocused();
  await page.keyboard.type(`python3 '${fixture}' '${encoding}' '${prefix}'`);
  await page.locator('.madlik-mobile-terminal-keys button').last().click();
  await expect.poll(async()=>{try{await readFile(prefix+'.ready');return true}catch{return false}},{timeout:10000}).toBe(true);
  await keyboard.click();
  const box=await screen.boundingBox();
  const x=Math.round(box.x+box.width/2), y=Math.round(box.y+box.height/2);
  // Exercise the real touch gesture and its deceleration after finger release.
  const cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let step=1;step<=5;step++) {
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-step*15}]});
   await page.waitForTimeout(15);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(700);
  await cdp.detach();
  // Deterministic reproduction: inertia must keep scrolling at the last position.
  const gesture = (type, fields) => screen.evaluate((element,{type,fields})=>{
   const event=new Event(type,{cancelable:true});Object.assign(event,fields);element.dispatchEvent(event);
  },{type,fields});
  await gesture('-xterm-gesturestart',{pageX:x,pageY:y});
  const beforeValid=(await readFile(prefix+'.bin')).length;
  await gesture('-xterm-gesturechange',{translationX:0,translationY:-48,clientX:x,clientY:y});
  await expect.poll(async()=>(await readFile(prefix+'.bin')).length).toBeGreaterThan(beforeValid);
  const beforeInertia=(await readFile(prefix+'.bin')).length;
  const valid=(await readFile(prefix+'.bin','utf8')).slice(beforeValid);
  await gesture('-xterm-gesturechange',{translationX:0,translationY:-48});
  await expect.poll(async()=>(await readFile(prefix+'.bin')).length).toBeGreaterThan(beforeInertia);
  const afterInertia=await readFile(prefix+'.bin','utf8');
  const inertial=afterInertia.slice(beforeInertia);
  const numeric=/\x1b\[<65;(\d+);(\d+)M/;
  expect(inertial.match(numeric)?.slice(1),'inertia uses last real coordinates').toEqual(valid.match(numeric)?.slice(1));
  expect(inertial).toMatch(numeric);
  // A fresh malformed gesture with no usable position must never reach the PTY.
  await gesture('-xterm-gesturestart',{});
  await gesture('-xterm-gesturechange',{translationX:0,translationY:-48});
  await page.waitForTimeout(200);
  expect(await readFile(prefix+'.bin','utf8')).toEqual(afterInertia);
  await writeFile(prefix+'.stop','');
  await expect.poll(async()=>{try{await readFile(prefix+'.done');return true}catch{return false}}).toBe(true);
  const received=await readFile(prefix+'.bin','utf8');
  expect(received,`${encoding}: invalid mouse report`).not.toContain('NaN');
  const reports=[...received.matchAll(/\x1b\[<(\d+);(\d+);(\d+)[Mm]/g)];
  expect(reports.length,`${encoding}: touch must still scroll the application`).toBeGreaterThan(0);
  for(const report of reports) { expect(Number(report[2])).toBeGreaterThan(0);expect(Number(report[3])).toBeGreaterThan(0); }
  await expect(keyboard).toHaveAttribute('aria-pressed','false');
  expect(await terminal.evaluate(element=>element===document.activeElement)).toBe(false);
  results.push(`SGR ${encoding}: real touch + inertia, valid numeric reports, browse mode preserved OK`);
 }
 console.log(results.join('\n'));
 await writeFile(path.join(cache,'test-terminal-touch-results.json'),JSON.stringify({results},null,2));
} catch(error) {
 if(page) {
  await page.screenshot({path:path.join(cache,'screenshots/touch-failure.png')}).catch(()=>{});
 }
 throw error;
} finally { await browser.close(); }
