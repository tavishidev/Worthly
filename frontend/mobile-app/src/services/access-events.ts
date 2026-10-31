type AccessListener = () => void;

const listeners = new Set<AccessListener>();

export function subscribeAccessChanges(listener: AccessListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitAccessChange() {
  listeners.forEach((listener) => listener());
}
