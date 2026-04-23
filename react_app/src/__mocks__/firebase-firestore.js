export const getFirestore = jest.fn(() => ({}));

export const doc = jest.fn((...args) => ({ _path: args.slice(1).join('/') }));
export const collection = jest.fn((...args) => ({ _path: args.slice(1).join('/') }));

export const getDoc = jest.fn(() =>
  Promise.resolve({
    exists: () => false,
    data: () => ({}),
    id: 'test-doc',
  }),
);

export const getDocs = jest.fn(() =>
  Promise.resolve({
    empty: true,
    docs: [],
    forEach: () => {},
    size: 0,
  }),
);

export const setDoc = jest.fn(() => Promise.resolve());
export const addDoc = jest.fn(() => Promise.resolve({ id: 'new-doc' }));
export const updateDoc = jest.fn(() => Promise.resolve());
export const deleteDoc = jest.fn(() => Promise.resolve());

export const query = jest.fn((...args) => args);
export const where = jest.fn((...args) => ({ _type: 'where', args }));
export const orderBy = jest.fn((...args) => ({ _type: 'orderBy', args }));
export const limit = jest.fn((...args) => ({ _type: 'limit', args }));

export const onSnapshot = jest.fn((_, cb) => {
  if (typeof cb === 'function') {
    cb({ empty: true, docs: [], forEach: () => {} });
  }
  return () => {};
});

export const serverTimestamp = jest.fn(() => ({ _type: 'serverTimestamp' }));
export const Timestamp = {
  now: jest.fn(() => ({ seconds: 0, nanoseconds: 0 })),
  fromDate: jest.fn((d) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 })),
};
