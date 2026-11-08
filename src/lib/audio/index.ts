let context: AudioContext | null = null;

// Must be called from a user gesture: wire it to the "Enable sound" button.
export async function unlockAudio() {
  context ??= new AudioContext();
  await context.resume();
  return context.state === "running";
}

export function beep(durationMs = 300, frequency = 880) {
  if (!context || context.state !== "running") return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency;
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + durationMs / 1000);
}

export function speak(text: string) {
  if (typeof speechSynthesis === "undefined") return;
  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}
