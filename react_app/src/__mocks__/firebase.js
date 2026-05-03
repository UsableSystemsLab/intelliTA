export const auth = {
  currentUser: null,
  signOut: jest.fn(() => Promise.resolve()),
};

export const db = {};

export default { auth, db };
