export const vibrate = (pattern: number | number[]) => {
  if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
    try {
      window.navigator.vibrate(pattern);
    } catch (e) {
      // Ignore
    }
  }
};

export const hapticLight = () => vibrate(10);
export const hapticMedium = () => vibrate(20);
export const hapticHeavy = () => vibrate(40);
export const hapticSuccess = () => vibrate([10, 50, 20]);
export const hapticWarning = () => vibrate([20, 50, 20, 50, 20]);
