export const getAuth = jest.fn(() => ({
  currentUser: null,
  signOut: jest.fn(() => Promise.resolve()),
}));

export const signInWithEmailAndPassword = jest.fn(() =>
  Promise.resolve({ user: { uid: 'test-uid', email: 'test@kau.edu.sa' } }),
);

export const createUserWithEmailAndPassword = jest.fn(() =>
  Promise.resolve({ user: { uid: 'test-uid', email: 'test@kau.edu.sa' } }),
);

export const signInWithPopup = jest.fn(() =>
  Promise.resolve({
    user: {
      uid: 'test-uid',
      email: 'test@kau.edu.sa',
      displayName: 'Test User',
      delete: jest.fn(() => Promise.resolve()),
    },
  }),
);

export const signOut = jest.fn(() => Promise.resolve());

export const onAuthStateChanged = jest.fn((auth, cb) => {
  cb(null);
  return () => {};
});

export const sendPasswordResetEmail = jest.fn(() => Promise.resolve());

export const updateProfile = jest.fn(() => Promise.resolve());

export class GoogleAuthProvider {
  constructor() {
    this.providerId = 'google.com';
  }
  static credential() {
    return {};
  }
}

export class GithubAuthProvider {
  constructor() {
    this.providerId = 'github.com';
  }
  static credential() {
    return {};
  }
}
