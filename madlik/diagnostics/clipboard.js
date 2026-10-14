"use strict";
const output = document.querySelector('#result');
let attempt = 0;
document.querySelector('#paste').addEventListener('click', event => {
  const id = ++attempt;
  const state = `click trusted=${event.isTrusted}\nactivation=${navigator.userActivation?.isActive ?? 'unknown'}\nsecure=${isSecureContext} top=${window.top === window}\nfocused=${document.hasFocus()}`;
  let read;
  try {
    // No commands, focus changes, event cancellation or UI updates before reading.
    read = navigator.clipboard.readText();
  } catch (error) {
    output.textContent = `${state}\nCall failed: ${String(error)}`;
    return;
  }
  // Keep the entire page unchanged while the browser opens its native callout.
  const timer = setTimeout(() => {
    if (id === attempt) output.textContent = `${state}\nStill waiting after 15 seconds. No browser answer.`;
  }, 15000);
  read.then(text => {
    if (id === attempt) output.textContent = `${state}\nSUCCESS: ${text.length} characters read. Content not displayed or stored.`;
  }, error => {
    if (id === attempt) output.textContent = `${state}\nFAILED: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`;
  }).finally(() => clearTimeout(timer));
});
