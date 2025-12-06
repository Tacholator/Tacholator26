/**
 * Audio notification helper
 * Plays sounds for new messages and notifications based on user preferences
 */

// Simple notification sound (higher pitch beep)
const createNotificationSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

// Message sound (double beep)
const createMessageSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // First beep
  const osc1 = audioContext.createOscillator();
  const gain1 = audioContext.createGain();
  osc1.connect(gain1);
  gain1.connect(audioContext.destination);
  osc1.frequency.value = 600;
  osc1.type = 'sine';
  gain1.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
  osc1.start(audioContext.currentTime);
  osc1.stop(audioContext.currentTime + 0.15);
  
  // Second beep
  const osc2 = audioContext.createOscillator();
  const gain2 = audioContext.createGain();
  osc2.connect(gain2);
  gain2.connect(audioContext.destination);
  osc2.frequency.value = 800;
  osc2.type = 'sine';
  gain2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.2);
  gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
  osc2.start(audioContext.currentTime + 0.2);
  osc2.stop(audioContext.currentTime + 0.35);
};

/**
 * Play notification sound if user preferences allow it
 * @param {Object} preferences - User notification preferences
 */
export const playNotificationSound = (preferences) => {
  if (!preferences) return;
  
  // Check if muted
  if (preferences.soundMuteMode) return;
  
  // Check if notification sounds enabled
  if (preferences.soundNotificationAlert === false) return;
  
  try {
    createNotificationSound();
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
};

/**
 * Play message sound if user preferences allow it
 * @param {Object} preferences - User notification preferences
 */
export const playMessageSound = (preferences) => {
  if (!preferences) return;
  
  // Check if muted
  if (preferences.soundMuteMode) return;
  
  // Check if message sounds enabled
  if (preferences.soundMessageAlert === false) return;
  
  try {
    createMessageSound();
  } catch (error) {
    console.error('Failed to play message sound:', error);
  }
};